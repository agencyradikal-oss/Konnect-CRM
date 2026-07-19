"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { generateWebhookSecret } from "@/lib/outbound-webhook";

async function requireOwner() {
  const ctx = await getCurrentBusiness();
  if (ctx.session.user.role !== "BUSINESS_OWNER") {
    throw new Error("Solo el dueño del negocio puede configurar integraciones.");
  }
  return ctx;
}

const webhookSchema = z.object({
  webhookUrl: z.string().max(2000).optional(),
  webhookEnabled: z.boolean(),
});

/** Guarda URL y estado del webhook de salida. */
export async function updateOutboundWebhook(input: unknown) {
  const { businessId } = await requireOwner();
  const data = webhookSchema.parse(input);

  const raw = data.webhookUrl?.trim() || "";
  if (raw) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { ok: false as const, error: "URL inválida." };
    }
    if (parsed.protocol !== "https:") {
      return { ok: false as const, error: "La URL debe ser https://." };
    }
  }

  const current = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { webhookSecret: true },
  });

  const url = raw || null;
  let secret = current.webhookSecret;
  if (url && !secret) {
    secret = generateWebhookSecret();
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      webhookUrl: url,
      webhookEnabled: Boolean(url) && data.webhookEnabled,
      webhookSecret: secret,
    },
  });

  revalidatePath("/app/integraciones");
  return { ok: true as const, secret: secret ?? null };
}

/** Regenera el secret del webhook (invalida firmas anteriores). */
export async function rotateWebhookSecret() {
  const { businessId } = await requireOwner();
  const secret = generateWebhookSecret();

  await prisma.business.update({
    where: { id: businessId },
    data: { webhookSecret: secret },
  });

  revalidatePath("/app/integraciones");
  return { ok: true as const, secret };
}
