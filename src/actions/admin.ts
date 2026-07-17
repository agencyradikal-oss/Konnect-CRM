"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { BusinessStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

const moderateSchema = z.object({
  businessId: z.string().min(1),
  status: z.nativeEnum(BusinessStatus),
});

export async function moderateBusiness(input: unknown) {
  await requireSuperAdmin();
  const data = moderateSchema.parse(input);

  await prisma.business.update({
    where: { id: data.businessId },
    data: { status: data.status },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

const reviewSchema = z.object({
  reviewId: z.string().min(1),
  approved: z.boolean(),
});

export async function moderateReview(input: unknown) {
  await requireSuperAdmin();
  const data = reviewSchema.parse(input);

  await prisma.review.update({
    where: { id: data.reviewId },
    data: { approved: data.approved },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}
