"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { sendBusinessApprovedEmail } from "@/lib/email";

const idSchema = z.object({ businessId: z.string().min(1) });

/** Aprobar negocio: ACTIVE + email al dueño vía Resend. */
export async function approveBusiness(input: unknown) {
  await requireSuperAdmin();
  const { businessId } = idSchema.parse(input);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { status: "ACTIVE" },
    include: { users: { select: { email: true }, take: 1 } },
  });

  const ownerEmail = business.users[0]?.email ?? business.email;
  if (ownerEmail) {
    await sendBusinessApprovedEmail({
      to: ownerEmail,
      businessName: business.name,
      slug: business.slug,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/directorio");
  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const };
}

/** Rechazar negocio: SUSPENDED (no aparece en el directorio). */
export async function rejectBusiness(input: unknown) {
  await requireSuperAdmin();
  const { businessId } = idSchema.parse(input);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/admin");
  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const };
}

const reviewSchema = z.object({ reviewId: z.string().min(1) });

export async function approveReview(input: unknown) {
  await requireSuperAdmin();
  const { reviewId } = reviewSchema.parse(input);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { approved: true },
    include: { business: { select: { slug: true } } },
  });

  revalidatePath("/admin");
  revalidatePath(`/negocio/${review.business.slug}`);
  return { ok: true as const };
}

export async function deleteReview(input: unknown) {
  await requireSuperAdmin();
  const { reviewId } = reviewSchema.parse(input);

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath("/admin");
  return { ok: true as const };
}
