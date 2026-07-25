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

export type EstimateAcceptedPayload = {
  id: string;
  type: "estimate.accepted";
  created_at: string;
  data: {
    estimate_id: string;
    invoice_id: string | null;
    business_id: string;
    business_slug: string;
    deal_id: string | null;
    number: number;
    total: number;
    currency: string;
  };
};

export type InvoiceCreatedPayload = {
  id: string;
  type: "invoice.created";
  created_at: string;
  data: {
    invoice_id: string;
    estimate_id: string | null;
    business_id: string;
    business_slug: string;
    deal_id: string | null;
    number: number;
    total: number;
    currency: string;
    status: string;
  };
};

export type InvoicePaidPayload = {
  id: string;
  type: "invoice.paid";
  created_at: string;
  data: {
    invoice_id: string;
    estimate_id: string | null;
    business_id: string;
    business_slug: string;
    deal_id: string | null;
    number: number;
    total: number;
    currency: string;
    paid_at: string;
  };
};

type OutboundEvent =
  | LeadCreatedPayload
  | EstimateAcceptedPayload
  | InvoiceCreatedPayload
  | InvoicePaidPayload;

export function generateWebhookSecret(): string {
  return `knwhsec_${randomBytes(24).toString("hex")}`;
}

export function signWebhookBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function dispatchOutboundWebhook(params: {
  businessId: string;
  event: OutboundEvent["type"];
  payload: OutboundEvent;
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

  const body = JSON.stringify(params.payload);
  const signature = signWebhookBody(body, business.webhookSecret);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(business.webhookUrl.trim(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Konnect-Signature": signature,
        "X-Konnect-Event": params.event,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(
        `[webhook] ${params.event} non-2xx`,
        res.status,
        params.businessId,
      );
    }
  } catch (error) {
    console.warn(`[webhook] ${params.event} failed:`, error);
  }
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
  await dispatchOutboundWebhook({
    businessId: params.businessId,
    event: "lead.created",
    payload,
  });
}

export async function dispatchEstimateAcceptedWebhook(params: {
  businessId: string;
  businessSlug: string;
  estimateId: string;
  invoiceId: string | null;
  dealId: string | null;
  number: number;
  total: number;
  currency: string;
  acceptedAt: Date;
}): Promise<void> {
  const payload: EstimateAcceptedPayload = {
    id: `evt_${params.estimateId}_accepted`,
    type: "estimate.accepted",
    created_at: params.acceptedAt.toISOString(),
    data: {
      estimate_id: params.estimateId,
      invoice_id: params.invoiceId,
      business_id: params.businessId,
      business_slug: params.businessSlug,
      deal_id: params.dealId,
      number: params.number,
      total: params.total,
      currency: params.currency,
    },
  };
  await dispatchOutboundWebhook({
    businessId: params.businessId,
    event: "estimate.accepted",
    payload,
  });
}

export async function dispatchInvoiceCreatedWebhook(params: {
  businessId: string;
  businessSlug: string;
  invoiceId: string;
  estimateId: string | null;
  dealId: string | null;
  number: number;
  total: number;
  currency: string;
  status: string;
  createdAt: Date;
}): Promise<void> {
  const payload: InvoiceCreatedPayload = {
    id: `evt_${params.invoiceId}_created`,
    type: "invoice.created",
    created_at: params.createdAt.toISOString(),
    data: {
      invoice_id: params.invoiceId,
      estimate_id: params.estimateId,
      business_id: params.businessId,
      business_slug: params.businessSlug,
      deal_id: params.dealId,
      number: params.number,
      total: params.total,
      currency: params.currency,
      status: params.status,
    },
  };
  await dispatchOutboundWebhook({
    businessId: params.businessId,
    event: "invoice.created",
    payload,
  });
}

export async function dispatchInvoicePaidWebhook(params: {
  businessId: string;
  businessSlug: string;
  invoiceId: string;
  estimateId: string | null;
  dealId: string | null;
  number: number;
  total: number;
  currency: string;
  paidAt: Date;
}): Promise<void> {
  const payload: InvoicePaidPayload = {
    id: `evt_${params.invoiceId}_paid`,
    type: "invoice.paid",
    created_at: params.paidAt.toISOString(),
    data: {
      invoice_id: params.invoiceId,
      estimate_id: params.estimateId,
      business_id: params.businessId,
      business_slug: params.businessSlug,
      deal_id: params.dealId,
      number: params.number,
      total: params.total,
      currency: params.currency,
      paid_at: params.paidAt.toISOString(),
    },
  };
  await dispatchOutboundWebhook({
    businessId: params.businessId,
    event: "invoice.paid",
    payload,
  });
}
