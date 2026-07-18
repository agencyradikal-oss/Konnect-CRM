"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** Registra una vista de perfil público (fire-and-forget desde el cliente). */
export async function trackProfilePageView(input: unknown) {
  const { slug } = z.object({ slug: z.string().min(1).max(120) }).parse(input);

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false as const };
  }

  await prisma.pageView.create({
    data: {
      businessId: business.id,
      slug,
    },
  });

  return { ok: true as const };
}
