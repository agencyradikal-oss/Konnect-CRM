"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeUserText } from "@/lib/sanitize";
import { assertLeadFormRateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  businessSlug: z.string().min(1).max(120),
  authorName: z.string().min(1).max(120),
  authorEmail: z.string().email().max(160),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

/** Reseña pública: queda pendiente de moderación (approved=false). */
export async function submitReview(input: unknown) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const rate = await assertLeadFormRateLimit();
  if (!rate.ok) return rate;

  const business = await prisma.business.findUnique({
    where: { slug: parsed.data.businessSlug },
    select: { id: true, status: true, slug: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false as const, error: "Negocio no disponible." };
  }

  const authorName = sanitizeUserText(parsed.data.authorName, 120);
  const comment = parsed.data.comment
    ? sanitizeUserText(parsed.data.comment, 2000)
    : null;

  await prisma.review.create({
    data: {
      businessId: business.id,
      authorName,
      authorEmail: parsed.data.authorEmail.trim().toLowerCase(),
      rating: parsed.data.rating,
      comment: comment || null,
      approved: false,
    },
  });

  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const };
}
