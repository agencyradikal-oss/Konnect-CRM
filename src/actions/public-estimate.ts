"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { EstimateStatus, InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertLeadFormRateLimit } from "@/lib/rate-limit";
import { decimalToNumber } from "@/lib/document-money";
import {
  hashDocumentToken,
  isDocumentTokenExpired,
} from "@/lib/document-token";
import {
  dispatchEstimateAcceptedWebhook,
  dispatchInvoiceCreatedWebhook,
} from "@/lib/outbound-webhook";

const tokenSchema = z.object({
  token: z.string().min(20).max(200),
});

async function findByToken(token: string) {
  const hash = hashDocumentToken(token);
  return prisma.estimate.findFirst({
    where: { publicTokenHash: hash },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          phone: true,
          email: true,
          city: true,
          state: true,
        },
      },
      contact: { select: { name: true, email: true, phone: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { id: true, status: true, number: true } },
    },
  });
}

export type PublicEstimateView = {
  number: number;
  status: EstimateStatus;
  currency: string;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  notes: string | null;
  validUntil: string | null;
  businessName: string;
  businessLogoUrl: string | null;
  businessCity: string | null;
  contactName: string | null;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  canRespond: boolean;
  invoiceStatus: InvoiceStatus | null;
};

export async function getPublicEstimate(
  token: string,
): Promise<
  | { ok: true; estimate: PublicEstimateView }
  | { ok: false; error: string }
> {
  const parsed = tokenSchema.safeParse({ token });
  if (!parsed.success) {
    return { ok: false, error: "Enlace inválido." };
  }

  const estimate = await findByToken(parsed.data.token);
  if (!estimate) {
    return { ok: false, error: "Este presupuesto no existe o el enlace expiró." };
  }
  if (isDocumentTokenExpired(estimate.publicTokenExpiresAt)) {
    return { ok: false, error: "Este enlace de presupuesto expiró." };
  }
  if (estimate.status === EstimateStatus.VOID) {
    return { ok: false, error: "Este presupuesto fue anulado." };
  }

  if (
    estimate.status === EstimateStatus.SENT ||
    estimate.status === EstimateStatus.VIEWED
  ) {
    const now = new Date();
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        status: EstimateStatus.VIEWED,
        viewedAt: estimate.viewedAt ?? now,
      },
    });
    if (estimate.dealId && !estimate.viewedAt) {
      await prisma.activity.create({
        data: {
          businessId: estimate.businessId,
          dealId: estimate.dealId,
          type: "estimate_viewed",
          content: `Presupuesto #${estimate.number} abierto por el cliente.`,
        },
      });
    }
  }

  const wasSendable =
    estimate.status === EstimateStatus.SENT ||
    estimate.status === EstimateStatus.VIEWED;

  const statusAfterView = wasSendable
    ? EstimateStatus.VIEWED
    : estimate.status;

  const canRespond = wasSendable;

  return {
    ok: true,
    estimate: {
      number: estimate.number,
      status: statusAfterView,
      currency: estimate.currency,
      taxRate: decimalToNumber(estimate.taxRate),
      taxAmount: decimalToNumber(estimate.taxAmount),
      subtotal: decimalToNumber(estimate.subtotal),
      total: decimalToNumber(estimate.total),
      notes: estimate.notes,
      validUntil: estimate.validUntil?.toISOString() ?? null,
      businessName: estimate.business.name,
      businessLogoUrl: estimate.business.logoUrl,
      businessCity: estimate.business.city,
      contactName: estimate.contact?.name ?? null,
      lines: estimate.lineItems.map((l) => ({
        description: l.description,
        quantity: decimalToNumber(l.quantity),
        unitPrice: decimalToNumber(l.unitPrice),
        amount: decimalToNumber(l.amount),
      })),
      canRespond,
      invoiceStatus: estimate.invoice?.status ?? null,
    },
  };
}

export async function acceptEstimate(input: unknown) {
  const rate = await assertLeadFormRateLimit();
  if (!rate.ok) {
    return { ok: false as const, error: "Demasiados intentos. Espera un momento." };
  }

  let token: string;
  try {
    token = tokenSchema.parse(input).token;
  } catch {
    return { ok: false as const, error: "Token inválido." };
  }

  const estimate = await findByToken(token);
  if (!estimate) {
    return { ok: false as const, error: "Presupuesto no encontrado." };
  }
  if (isDocumentTokenExpired(estimate.publicTokenExpiresAt)) {
    return { ok: false as const, error: "El enlace expiró." };
  }
  if (estimate.status === EstimateStatus.ACCEPTED && estimate.invoice) {
    return { ok: true as const, already: true as const };
  }
  if (
    estimate.status === EstimateStatus.VOID ||
    estimate.status === EstimateStatus.REJECTED ||
    estimate.status === EstimateStatus.EXPIRED
  ) {
    return { ok: false as const, error: "Este presupuesto ya no se puede aceptar." };
  }

  const acceptedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const lastInv = await tx.invoice.findFirst({
      where: { businessId: estimate.businessId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const invoiceNumber = (lastInv?.number ?? 0) + 1;

    const invoice = await tx.invoice.create({
      data: {
        businessId: estimate.businessId,
        dealId: estimate.dealId,
        contactId: estimate.contactId,
        estimateId: estimate.id,
        number: invoiceNumber,
        status: InvoiceStatus.PENDING,
        currency: estimate.currency,
        taxRate: estimate.taxRate,
        taxAmount: estimate.taxAmount,
        subtotal: estimate.subtotal,
        total: estimate.total,
        notes: estimate.notes,
        lineItems: {
          create: estimate.lineItems.map((l, i) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            sortOrder: i,
          })),
        },
      },
    });

    await tx.estimate.update({
      where: { id: estimate.id },
      data: {
        status: EstimateStatus.ACCEPTED,
        acceptedAt,
      },
    });

    if (estimate.dealId) {
      await tx.activity.create({
        data: {
          businessId: estimate.businessId,
          dealId: estimate.dealId,
          type: "estimate_accepted",
          content: `Presupuesto #${estimate.number} aceptado. Factura #${invoiceNumber} pendiente.`,
        },
      });
      await tx.deal.update({
        where: { id: estimate.dealId },
        data: {
          stage: "NEGOCIACION",
          value: estimate.total,
        },
      });
    }

    return invoice;
  });

  await Promise.all([
    dispatchEstimateAcceptedWebhook({
      businessId: estimate.businessId,
      businessSlug: estimate.business.slug,
      estimateId: estimate.id,
      invoiceId: result.id,
      dealId: estimate.dealId,
      number: estimate.number,
      total: decimalToNumber(estimate.total),
      currency: estimate.currency,
      acceptedAt,
    }),
    dispatchInvoiceCreatedWebhook({
      businessId: estimate.businessId,
      businessSlug: estimate.business.slug,
      invoiceId: result.id,
      estimateId: estimate.id,
      dealId: estimate.dealId,
      number: result.number,
      total: decimalToNumber(result.total),
      currency: result.currency,
      status: result.status,
      createdAt: result.createdAt,
    }),
  ]).catch((err) => console.warn("[acceptEstimate] webhooks", err));

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const, invoiceId: result.id };
}

export async function rejectEstimate(input: unknown) {
  const rate = await assertLeadFormRateLimit();
  if (!rate.ok) {
    return { ok: false as const, error: "Demasiados intentos. Espera un momento." };
  }

  let token: string;
  try {
    token = tokenSchema.parse(input).token;
  } catch {
    return { ok: false as const, error: "Token inválido." };
  }

  const estimate = await findByToken(token);
  if (!estimate) {
    return { ok: false as const, error: "Presupuesto no encontrado." };
  }
  if (
    estimate.status === EstimateStatus.ACCEPTED ||
    estimate.status === EstimateStatus.VOID
  ) {
    return { ok: false as const, error: "Este presupuesto ya no se puede rechazar." };
  }

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.REJECTED,
      rejectedAt: new Date(),
    },
  });

  if (estimate.dealId) {
    await prisma.activity.create({
      data: {
        businessId: estimate.businessId,
        dealId: estimate.dealId,
        type: "estimate_rejected",
        content: `Presupuesto #${estimate.number} rechazado por el cliente.`,
      },
    });
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const };
}
