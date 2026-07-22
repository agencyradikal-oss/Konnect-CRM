import type { Plan, PrismaClient } from "@prisma/client";
import { applyPlanToBusiness } from "@/lib/billing-sync";

type Db = PrismaClient;

export const COURTESY_PLAN: Plan = "PREMIUM";

export function normalizeCourtesyEmail(email: string) {
  return email.toLowerCase().trim();
}

/** Aplica Premium + planCourtesy al negocio del usuario (si existe). */
export async function applyCourtesyForEmail(db: Db, email: string) {
  const normalized = normalizeCourtesyEmail(email);

  const entitlement = await db.planCourtesyEntitlement.findUnique({
    where: { email: normalized },
  });
  if (!entitlement || entitlement.revokedAt) {
    return { applied: false as const, reason: "no_active_entitlement" as const };
  }

  const user = await db.user.findUnique({
    where: { email: normalized },
    select: { id: true, businessId: true },
  });

  if (!user?.businessId) {
    return { applied: false as const, reason: "no_business" as const };
  }

  await applyPlanToBusiness(db, user.businessId, COURTESY_PLAN, {
    forceCourtesy: true,
  });

  await db.planCourtesyEntitlement.update({
    where: { id: entitlement.id },
    data: { businessId: user.businessId },
  });

  return {
    applied: true as const,
    businessId: user.businessId,
  };
}

/** Tras vincular un businessId a un usuario, intenta aplicar cortesía. */
export async function applyCourtesyForUserBusiness(
  db: Db,
  params: { email: string; businessId: string },
) {
  const normalized = normalizeCourtesyEmail(params.email);

  const entitlement = await db.planCourtesyEntitlement.findFirst({
    where: { email: normalized, revokedAt: null },
  });
  if (!entitlement) return { applied: false as const };

  await applyPlanToBusiness(db, params.businessId, COURTESY_PLAN, {
    forceCourtesy: true,
  });

  await db.planCourtesyEntitlement.update({
    where: { id: entitlement.id },
    data: { businessId: params.businessId },
  });

  return { applied: true as const };
}

/** Revoca cortesía: quita flag y baja a FREE (salvo que tengan Stripe activo). */
export async function revokeCourtesyForEmail(db: Db, email: string) {
  const normalized = normalizeCourtesyEmail(email);
  const entitlement = await db.planCourtesyEntitlement.findUnique({
    where: { email: normalized },
  });
  if (!entitlement) {
    return { ok: false as const, error: "Entitlement no encontrado." };
  }
  if (entitlement.revokedAt) {
    return { ok: true as const, alreadyRevoked: true as const };
  }

  await db.planCourtesyEntitlement.update({
    where: { id: entitlement.id },
    data: { revokedAt: new Date() },
  });

  const businessId = entitlement.businessId;
  if (businessId) {
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        planCourtesy: true,
        stripeSubscriptionId: true,
      },
    });
    if (business?.planCourtesy) {
      // Si aún pagan por Stripe, dejar que el webhook/sync real fije el plan;
      // si no, volver a FREE.
      if (business.stripeSubscriptionId) {
        await db.business.update({
          where: { id: businessId },
          data: { planCourtesy: false },
        });
      } else {
        await applyPlanToBusiness(db, businessId, "FREE", {
          clearCourtesy: true,
        });
      }
    }
  }

  return { ok: true as const, alreadyRevoked: false as const };
}
