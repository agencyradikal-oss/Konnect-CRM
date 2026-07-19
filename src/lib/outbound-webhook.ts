import { createHmac, randomBytes } from "crypto";
import type { Lead, LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LeadCreatedPayload = {
  id: string;
  type: "lead.created";
  created_at: string;
  data: {
    lead_id: string;
    business_id: string;
    business_slug: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string | null;
    source: LeadSource;
  };
};

export function generateWebhookSecret(): string {
  return `knwhsec_${randomBytes(24).toString("hex")}`;
}

export function signWebhookBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * POST firmado a la URL del negocio (fire-and-forget).
 * Header: X-Konnect-Signature = hex HMAC-SHA256(body, webhookSecret)
 */
export async function dispatchLeadCreatedWebhook(params: {
  businessId: string;
  businessSlug: string;
  lead: Pick<
    Lead,
    "id" | "name" | "email" | "phone" | "message" | "source" | "createdAt"
  >;
}): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: {
      webhookEnabled: true,
      webhookUrl: true,
      webhookSecret: true,
    },
  });

  if (
    !business?.webhookEnabled ||
    !business.webhookUrl?.trim() ||
    !business.webhookSecret?.trim()
  ) {
    return;
  }

  const payload: LeadCreatedPayload = {
    id: `evt_${params.lead.id}`,
    type: "lead.created",
    created_at: params.lead.createdAt.toISOString(),
    data: {
      lead_id: params.lead.id,
      business_id: params.businessId,
      business_slug: params.businessSlug,
      name: params.lead.name,
      email: params.lead.email,
      phone: params.lead.phone,
      message: params.lead.message,
      source: params.lead.source,
    },
  };

  const body = JSON.stringify(payload);
  const signature = signWebhookBody(body, business.webhookSecret);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(business.webhookUrl.trim(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Konnect-Signature": signature,
        "X-Konnect-Event": "lead.created",
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(
        "[webhook] lead.created non-2xx",
        res.status,
        params.businessId,
      );
    }
  } catch (error) {
    console.warn("[webhook] lead.created failed:", error);
  }
}
