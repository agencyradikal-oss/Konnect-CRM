"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncClerkUserMetadata } from "@/lib/clerk-sync";
import {
  hashClaimToken,
  isClaimTokenExpired,
  normalizeClaimEmail,
} from "@/lib/business-claim";

const claimSchema = z.object({
  token: z.string().min(20).max(200),
});

export type ClaimPreview =
  | {
      ok: true;
      businessName: string;
      claimEmailMasked: string;
      expiresAt: string | null;
    }
  | { ok: false; error: string };

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

/** Vista pública del token (sin exponer claimEmail completo). */
export async function getClaimPreview(token: string): Promise<ClaimPreview> {
  const parsed = claimSchema.safeParse({ token });
  if (!parsed.success) {
    return { ok: false, error: "Enlace de reclamo inválido." };
  }

  const hash = hashClaimToken(parsed.data.token);
  const business = await prisma.business.findFirst({
    where: { claimTokenHash: hash },
    select: {
      name: true,
      claimEmail: true,
      claimTokenExpiresAt: true,
      claimedAt: true,
      users: {
        where: { role: Role.BUSINESS_OWNER },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!business) {
    return { ok: false, error: "Este enlace no es válido o ya fue usado." };
  }
  if (business.claimedAt || business.users.length > 0) {
    return { ok: false, error: "Este negocio ya fue reclamado." };
  }
  if (isClaimTokenExpired(business.claimTokenExpiresAt)) {
    return {
      ok: false,
      error: "Este enlace expiró. Pide una nueva invitación al administrador.",
    };
  }
  if (!business.claimEmail) {
    return { ok: false, error: "Este enlace no está listo para reclamar." };
  }

  return {
    ok: true,
    businessName: business.name,
    claimEmailMasked: maskEmail(business.claimEmail),
    expiresAt: business.claimTokenExpiresAt?.toISOString() ?? null,
  };
}

/** Reclama el negocio con token + email de sesión (debe coincidir con claimEmail). */
export async function claimBusinessWithToken(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Inicia sesión para reclamar." };
  }

  let token: string;
  try {
    token = claimSchema.parse(input).token;
  } catch {
    return { ok: false as const, error: "Token inválido." };
  }

  if (session.user.businessId) {
    return {
      ok: false as const,
      error: "Ya tienes un negocio vinculado a tu cuenta.",
    };
  }

  const sessionEmail = normalizeClaimEmail(session.user.email);
  const hash = hashClaimToken(token);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.findFirst({
        where: { claimTokenHash: hash },
        select: {
          id: true,
          name: true,
          slug: true,
          claimEmail: true,
          claimTokenExpiresAt: true,
          claimedAt: true,
          users: {
            where: { role: Role.BUSINESS_OWNER },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!business) {
        return { ok: false as const, error: "Enlace inválido o ya usado." };
      }
      if (business.claimedAt || business.users.length > 0) {
        return { ok: false as const, error: "Este negocio ya fue reclamado." };
      }
      if (isClaimTokenExpired(business.claimTokenExpiresAt)) {
        return {
          ok: false as const,
          error: "El enlace expiró. Solicita una nueva invitación.",
        };
      }
      if (!business.claimEmail) {
        return { ok: false as const, error: "No hay email de reclamo asignado." };
      }
      if (normalizeClaimEmail(business.claimEmail) !== sessionEmail) {
        return {
          ok: false as const,
          error:
            "Debes iniciar sesión con el correo de la invitación para reclamar este negocio.",
        };
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { businessId: business.id, role: Role.BUSINESS_OWNER },
      });

      await tx.business.update({
        where: { id: business.id },
        data: {
          claimedAt: new Date(),
          claimTokenHash: null,
          claimTokenExpiresAt: null,
        },
      });

      return {
        ok: true as const,
        businessId: business.id,
        slug: business.slug,
        name: business.name,
      };
    });

    if (!result.ok) return result;

    const linked = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clerkUserId: true, role: true, disabled: true },
    });
    if (linked?.clerkUserId) {
      await syncClerkUserMetadata({
        clerkUserId: linked.clerkUserId,
        konnectUserId: session.user.id,
        role: linked.role,
        businessId: result.businessId,
        disabled: linked.disabled,
      });
    }

    const { applyCourtesyForUserBusiness } = await import(
      "@/lib/plan-courtesy"
    );
    await applyCourtesyForUserBusiness(prisma, {
      email: sessionEmail,
      businessId: result.businessId,
    }).catch((err) =>
      console.error("[claimBusinessWithToken] plan courtesy:", err),
    );

    revalidatePath("/app/dashboard");
    revalidatePath(`/negocio/${result.slug}`);
    revalidatePath("/admin/reclamos");

    return { ok: true as const, slug: result.slug, name: result.name };
  } catch (error) {
    console.error("[claimBusinessWithToken]", error);
    return {
      ok: false as const,
      error: "No se pudo reclamar el negocio. Inténtalo de nuevo.",
    };
  }
}
