"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import {
  applyCourtesyForEmail,
  normalizeCourtesyEmail,
  revokeCourtesyForEmail,
  COURTESY_PLAN,
} from "@/lib/plan-courtesy";

function revalidateCourtesyAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/socios");
  revalidatePath("/app/plan");
}

const grantSchema = z.object({
  email: z.string().email("Email inválido"),
  note: z.string().max(200).optional(),
});

const emailSchema = z.object({
  email: z.string().email("Email inválido"),
});

/** Otorga Premium lifetime de cortesía a un email de socio. */
export async function grantPlanCourtesy(input: unknown) {
  await requireSuperAdmin();
  const data = grantSchema.parse(input);
  const email = normalizeCourtesyEmail(data.email);

  const existing = await prisma.planCourtesyEntitlement.findUnique({
    where: { email },
  });

  if (existing && !existing.revokedAt) {
    const applied = await applyCourtesyForEmail(prisma, email);
    revalidateCourtesyAdmin();
    return {
      ok: true as const,
      alreadyActive: true as const,
      applied: applied.applied,
    };
  }

  if (existing?.revokedAt) {
    await prisma.planCourtesyEntitlement.update({
      where: { id: existing.id },
      data: {
        revokedAt: null,
        plan: COURTESY_PLAN,
        note: data.note?.trim() || existing.note || "Socio — lifetime cortesía",
        grantedAt: new Date(),
        businessId: null,
      },
    });
  } else {
    await prisma.planCourtesyEntitlement.create({
      data: {
        email,
        plan: COURTESY_PLAN,
        note: data.note?.trim() || "Socio — lifetime cortesía",
      },
    });
  }

  const applied = await applyCourtesyForEmail(prisma, email);
  revalidateCourtesyAdmin();
  return {
    ok: true as const,
    alreadyActive: false as const,
    applied: applied.applied,
  };
}

/** Revoca la cortesía lifetime de un email. */
export async function revokePlanCourtesy(input: unknown) {
  await requireSuperAdmin();
  const { email } = emailSchema.parse(input);
  const result = await revokeCourtesyForEmail(prisma, email);
  revalidateCourtesyAdmin();
  return result;
}

/** Reaplica cortesía si el usuario ya tiene negocio (útil tras registro). */
export async function syncPlanCourtesy(input: unknown) {
  await requireSuperAdmin();
  const { email } = emailSchema.parse(input);
  const applied = await applyCourtesyForEmail(prisma, email);
  revalidateCourtesyAdmin();
  return { ok: true as const, ...applied };
}
