"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { generateApiKeyPlaintext } from "@/lib/api-keys";

/** Crea API key; el plaintext solo se muestra una vez. */
export async function createBusinessApiKey(input: unknown) {
  const { businessId, session } = await requireBusinessSession();
  if (
    session.user.role !== "BUSINESS_OWNER" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return { ok: false as const, error: "Solo el dueño puede crear API keys." };
  }

  const data = z
    .object({ name: z.string().min(1).max(80) })
    .parse(input);

  const active = await prisma.businessApiKey.count({
    where: { businessId, revokedAt: null },
  });
  if (active >= 5) {
    return {
      ok: false as const,
      error: "Máximo 5 API keys activas por negocio.",
    };
  }

  const { plaintext, prefix, hash } = generateApiKeyPlaintext();
  const row = await prisma.businessApiKey.create({
    data: {
      businessId,
      name: data.name.trim(),
      prefix,
      keyHash: hash,
    },
  });

  revalidatePath("/app/integraciones");
  return {
    ok: true as const,
    id: row.id,
    prefix,
    /** Mostrar una sola vez al dueño. */
    secret: plaintext,
  };
}

export async function revokeBusinessApiKey(input: unknown) {
  const { businessId, session } = await requireBusinessSession();
  if (
    session.user.role !== "BUSINESS_OWNER" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return { ok: false as const, error: "Solo el dueño puede revocar keys." };
  }

  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const { count } = await prisma.businessApiKey.updateMany({
    where: { id, businessId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) {
    return { ok: false as const, error: "Key no encontrada." };
  }
  revalidatePath("/app/integraciones");
  return { ok: true as const };
}

export async function listBusinessApiKeys() {
  const { businessId } = await requireBusinessSession();
  return prisma.businessApiKey.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
}
