"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { sendBusinessClaimInviteEmail } from "@/lib/email";
import {
  claimTokenExpiry,
  generateClaimToken,
  hashClaimToken,
  normalizeClaimEmail,
} from "@/lib/business-claim";

const businessIdSchema = z.object({
  businessId: z.string().min(1),
});

const assignSchema = z.object({
  businessId: z.string().min(1),
  email: z.string().email("Email inválido."),
});

async function assertUnclaimed(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      claimEmail: true,
      claimedAt: true,
      users: {
        where: { role: Role.BUSINESS_OWNER },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!business) {
    return { ok: false as const, error: "Negocio no encontrado." };
  }
  if (business.claimedAt || business.users.length > 0) {
    return {
      ok: false as const,
      error: "Este negocio ya tiene dueño o ya fue reclamado.",
    };
  }
  return { ok: true as const, business };
}

/** Asigna email de reclamo y genera (o regenera) token. */
export async function assignClaimEmail(input: unknown) {
  await requireSuperAdmin();
  const data = assignSchema.parse(input);
  const email = normalizeClaimEmail(data.email);

  const check = await assertUnclaimed(data.businessId);
  if (!check.ok) return check;

  const other = await prisma.business.findFirst({
    where: {
      claimEmail: email,
      id: { not: data.businessId },
      claimedAt: null,
    },
    select: { id: true, name: true },
  });
  if (other) {
    return {
      ok: false as const,
      error: `Ese email ya está asignado a «${other.name}».`,
    };
  }

  const token = generateClaimToken();
  const claimTokenHash = hashClaimToken(token);
  const claimTokenExpiresAt = claimTokenExpiry();

  await prisma.business.update({
    where: { id: data.businessId },
    data: {
      claimEmail: email,
      claimTokenHash,
      claimTokenExpiresAt,
    },
  });

  revalidatePath("/admin/reclamos");
  return {
    ok: true as const,
    token,
    claimUrl: `/reclamar/${token}`,
  };
}

/** Regenera el token manteniendo claimEmail. */
export async function regenerateClaimToken(input: unknown) {
  await requireSuperAdmin();
  const { businessId } = businessIdSchema.parse(input);

  const check = await assertUnclaimed(businessId);
  if (!check.ok) return check;
  if (!check.business.claimEmail) {
    return {
      ok: false as const,
      error: "Asigna un email de reclamo primero.",
    };
  }

  const token = generateClaimToken();
  await prisma.business.update({
    where: { id: businessId },
    data: {
      claimTokenHash: hashClaimToken(token),
      claimTokenExpiresAt: claimTokenExpiry(),
    },
  });

  revalidatePath("/admin/reclamos");
  return {
    ok: true as const,
    token,
    claimUrl: `/reclamar/${token}`,
  };
}

/** Revoca email y token de reclamo. */
export async function revokeClaimInvite(input: unknown) {
  await requireSuperAdmin();
  const { businessId } = businessIdSchema.parse(input);

  const check = await assertUnclaimed(businessId);
  if (!check.ok) return check;

  await prisma.business.update({
    where: { id: businessId },
    data: {
      claimEmail: null,
      claimTokenHash: null,
      claimTokenExpiresAt: null,
    },
  });

  revalidatePath("/admin/reclamos");
  return { ok: true as const };
}

/** Envía (o reenvía) invitación por Resend. Siempre regenera token para el link. */
export async function sendClaimInvite(input: unknown) {
  await requireSuperAdmin();
  const { businessId } = businessIdSchema.parse(input);

  const check = await assertUnclaimed(businessId);
  if (!check.ok) return check;

  const claimEmail = check.business.claimEmail;
  if (!claimEmail) {
    return {
      ok: false as const,
      error: "Asigna un email de reclamo primero.",
    };
  }

  const plainToken = generateClaimToken();
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      claimTokenHash: hashClaimToken(plainToken),
      claimTokenExpiresAt: claimTokenExpiry(),
    },
    select: { name: true },
  });

  await sendBusinessClaimInviteEmail({
    to: claimEmail,
    businessName: updated.name,
    token: plainToken,
  });

  revalidatePath("/admin/reclamos");
  return { ok: true as const, claimUrl: `/reclamar/${plainToken}` };
}
