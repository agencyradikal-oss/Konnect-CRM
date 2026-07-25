"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { EstimateStatus, InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getBusinessPlanLimits } from "@/lib/plans";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendEstimateEmail } from "@/lib/email";
import {
  computeDocumentTotals,
  decimalToNumber,
  lineAmount,
  toDecimal,
  type MoneyLine,
} from "@/lib/document-money";
import {
  documentTokenExpiry,
  generateDocumentToken,
  hashDocumentToken,
} from "@/lib/document-token";
import { dispatchInvoicePaidWebhook } from "@/lib/outbound-webhook";
import { formatMoney } from "@/lib/date-range";

const lineSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive().max(1_000_000),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
});

const createSchema = z.object({
  dealId: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  validUntil: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50),
});

const updateSchema = z.object({
  estimateId: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  validUntil: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50).optional(),
});

const idSchema = z.object({ estimateId: z.string().min(1) });
const invoiceIdSchema = z.object({ invoiceId: z.string().min(1) });

async function requireEstimatesAccess() {
  const ctx = await getCurrentBusiness();
  const limits = getBusinessPlanLimits(ctx.business);
  if (!limits.estimates) {
    return {
      ok: false as const,
      error: "Presupuestos disponibles en plan Pro o Premium.",
      ctx: null,
    };
  }
  return { ok: true as const, ctx, error: null };
}

function parseValidUntil(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function nextEstimateNumber(businessId: string): Promise<number> {
  const last = await prisma.estimate.findFirst({
    where: { businessId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

function serializeEstimate<T extends {
  subtotal: unknown;
  taxAmount: unknown;
  taxRate: unknown;
  total: unknown;
  lineItems?: { quantity: unknown; unitPrice: unknown; amount: unknown; description: string; id: string; sortOrder: number }[];
}>(e: T) {
  return {
    ...e,
    subtotal: decimalToNumber(e.subtotal as never),
    taxAmount: decimalToNumber(e.taxAmount as never),
    taxRate: decimalToNumber(e.taxRate as never),
    total: decimalToNumber(e.total as never),
    lineItems: e.lineItems?.map((l) => ({
      ...l,
      quantity: decimalToNumber(l.quantity as never),
      unitPrice: decimalToNumber(l.unitPrice as never),
      amount: decimalToNumber(l.amount as never),
    })),
  };
}

export async function listEstimatesForDeal(dealId: string) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error!, items: [] };

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, businessId: access.ctx.businessId },
    select: { id: true },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado.", items: [] };

  const items = await prisma.estimate.findMany({
    where: { businessId: access.ctx.businessId, dealId },
    orderBy: { createdAt: "desc" },
    include: {
      invoice: { select: { id: true, status: true, number: true, paidAt: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  return {
    ok: true as const,
    items: items.map((e) => serializeEstimate(e)),
  };
}

export async function listBusinessEstimates() {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error!, items: [] };

  const items = await prisma.estimate.findMany({
    where: { businessId: access.ctx.businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      deal: { select: { id: true, title: true } },
      contact: { select: { id: true, name: true, email: true, phone: true } },
      invoice: { select: { id: true, status: true, number: true, paidAt: true } },
    },
  });

  return {
    ok: true as const,
    items: items.map((e) => serializeEstimate(e)),
  };
}

export async function createEstimate(input: unknown) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error! };

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(input);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false as const, error: e.issues[0]?.message ?? "Datos inválidos." };
    }
    return { ok: false as const, error: "Datos inválidos." };
  }

  const deal = await prisma.deal.findFirst({
    where: { id: data.dealId, businessId: access.ctx.businessId },
    select: { id: true, contactId: true, title: true },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado." };

  const totals = computeDocumentTotals(data.lines as MoneyLine[], data.taxRate);
  const businessId = access.ctx.businessId;
  const number = await nextEstimateNumber(businessId);

  const estimate = await prisma.$transaction(async (tx) => {
    const created = await tx.estimate.create({
      data: {
        businessId,
        dealId: deal.id,
        contactId: deal.contactId,
        number,
        notes: data.notes?.trim() || null,
        taxRate: toDecimal(totals.taxRate),
        taxAmount: toDecimal(totals.taxAmount),
        subtotal: toDecimal(totals.subtotal),
        total: toDecimal(totals.total),
        validUntil: parseValidUntil(data.validUntil),
        lineItems: {
          create: data.lines.map((l, i) => ({
            description: l.description,
            quantity: toDecimal(l.quantity),
            unitPrice: toDecimal(l.unitPrice),
            amount: toDecimal(lineAmount(l.quantity, l.unitPrice)),
            sortOrder: i,
          })),
        },
      },
    });

    await tx.activity.create({
      data: {
        businessId,
        dealId: deal.id,
        type: "estimate_created",
        content: `Presupuesto #${number} creado (borrador).`,
      },
    });

    return created;
  });

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const, estimateId: estimate.id };
}

export async function updateEstimate(input: unknown) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error! };

  let data: z.infer<typeof updateSchema>;
  try {
    data = updateSchema.parse(input);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false as const, error: e.issues[0]?.message ?? "Datos inválidos." };
    }
    return { ok: false as const, error: "Datos inválidos." };
  }

  const existing = await prisma.estimate.findFirst({
    where: { id: data.estimateId, businessId: access.ctx.businessId },
    include: { lineItems: true },
  });
  if (!existing) return { ok: false as const, error: "Presupuesto no encontrado." };
  if (
    existing.status !== EstimateStatus.DRAFT &&
    existing.status !== EstimateStatus.SENT &&
    existing.status !== EstimateStatus.VIEWED
  ) {
    return { ok: false as const, error: "Solo puedes editar borradores o enviados no aceptados." };
  }

  const lines = data.lines ?? existing.lineItems.map((l) => ({
    description: l.description,
    quantity: decimalToNumber(l.quantity),
    unitPrice: decimalToNumber(l.unitPrice),
  }));
  const taxRate =
    data.taxRate ?? decimalToNumber(existing.taxRate);
  const totals = computeDocumentTotals(lines, taxRate);

  await prisma.$transaction(async (tx) => {
    if (data.lines) {
      await tx.documentLineItem.deleteMany({ where: { estimateId: existing.id } });
      await tx.documentLineItem.createMany({
        data: data.lines.map((l, i) => ({
          estimateId: existing.id,
          description: l.description,
          quantity: toDecimal(l.quantity),
          unitPrice: toDecimal(l.unitPrice),
          amount: toDecimal(lineAmount(l.quantity, l.unitPrice)),
          sortOrder: i,
        })),
      });
    }

    await tx.estimate.update({
      where: { id: existing.id },
      data: {
        notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
        taxRate: toDecimal(totals.taxRate),
        taxAmount: toDecimal(totals.taxAmount),
        subtotal: toDecimal(totals.subtotal),
        total: toDecimal(totals.total),
        validUntil:
          data.validUntil === undefined
            ? undefined
            : parseValidUntil(data.validUntil),
        status:
          existing.status === EstimateStatus.VIEWED
            ? EstimateStatus.SENT
            : existing.status,
      },
    });
  });

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const };
}

export async function sendEstimate(input: unknown) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error! };

  const { estimateId } = idSchema.parse(input);
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, businessId: access.ctx.businessId },
    include: {
      contact: { select: { name: true, email: true, phone: true } },
      deal: { select: { id: true } },
      lineItems: true,
    },
  });
  if (!estimate) return { ok: false as const, error: "Presupuesto no encontrado." };
  if (estimate.status === EstimateStatus.VOID || estimate.status === EstimateStatus.ACCEPTED) {
    return { ok: false as const, error: "No se puede enviar este presupuesto." };
  }
  if (estimate.lineItems.length === 0) {
    return { ok: false as const, error: "Agrega al menos una línea." };
  }

  const token = generateDocumentToken();
  const publicUrl = `${getAppBaseUrl()}/p/${token}`;

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.SENT,
      publicTokenHash: hashDocumentToken(token),
      publicTokenExpiresAt: documentTokenExpiry(),
      sentAt: new Date(),
    },
  });

  if (estimate.dealId) {
    await prisma.activity.create({
      data: {
        businessId: access.ctx.businessId,
        dealId: estimate.dealId,
        type: "estimate_sent",
        content: `Presupuesto #${estimate.number} enviado.`,
      },
    });

    const deal = await prisma.deal.findUnique({
      where: { id: estimate.dealId },
      select: { stage: true },
    });
    if (deal && (deal.stage === "NUEVO" || deal.stage === "CONTACTADO")) {
      await prisma.deal.update({
        where: { id: estimate.dealId },
        data: { stage: "COTIZADO" },
      });
      await prisma.activity.create({
        data: {
          businessId: access.ctx.businessId,
          dealId: estimate.dealId,
          type: "stage_change",
          content: "Etapa → Cotizado (presupuesto enviado).",
        },
      });
    }
  }

  const email = estimate.contact?.email?.trim();
  if (email) {
    await sendEstimateEmail({
      to: email,
      businessName: access.ctx.business.name,
      estimateNumber: estimate.number,
      totalLabel: formatMoney(decimalToNumber(estimate.total)),
      token,
      clientName: estimate.contact?.name,
    });
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");

  return {
    ok: true as const,
    publicUrl,
    token,
    emailed: Boolean(email),
    contactPhone: estimate.contact?.phone ?? null,
  };
}

export async function voidEstimate(input: unknown) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error! };

  const { estimateId } = idSchema.parse(input);
  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, businessId: access.ctx.businessId },
  });
  if (!estimate) return { ok: false as const, error: "Presupuesto no encontrado." };
  if (estimate.status === EstimateStatus.ACCEPTED) {
    return { ok: false as const, error: "No puedes anular un presupuesto aceptado." };
  }

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.VOID,
      publicTokenHash: null,
      publicTokenExpiresAt: null,
    },
  });

  if (estimate.dealId) {
    await prisma.activity.create({
      data: {
        businessId: access.ctx.businessId,
        dealId: estimate.dealId,
        type: "estimate_void",
        content: `Presupuesto #${estimate.number} anulado.`,
      },
    });
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const };
}

export async function markInvoicePaid(input: unknown) {
  const access = await requireEstimatesAccess();
  if (!access.ok || !access.ctx) return { ok: false as const, error: access.error! };

  const { invoiceId } = invoiceIdSchema.parse(input);
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId: access.ctx.businessId },
    include: { estimate: { select: { id: true } } },
  });
  if (!invoice) return { ok: false as const, error: "Factura no encontrada." };
  if (invoice.status === InvoiceStatus.PAID) {
    return { ok: true as const, already: true as const };
  }
  if (invoice.status === InvoiceStatus.VOID) {
    return { ok: false as const, error: "Factura anulada." };
  }

  const paidAt = new Date();
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: InvoiceStatus.PAID, paidAt },
  });

  if (invoice.dealId) {
    await prisma.activity.create({
      data: {
        businessId: access.ctx.businessId,
        dealId: invoice.dealId,
        type: "invoice_paid",
        content: `Factura #${invoice.number} marcada como pagada.`,
      },
    });
    await prisma.deal.update({
      where: { id: invoice.dealId },
      data: { stage: "GANADO", value: invoice.total },
    });
  }

  await dispatchInvoicePaidWebhook({
    businessId: access.ctx.businessId,
    businessSlug: access.ctx.business.slug,
    invoiceId: invoice.id,
    estimateId: invoice.estimateId,
    dealId: invoice.dealId,
    number: invoice.number,
    total: decimalToNumber(invoice.total),
    currency: invoice.currency,
    paidAt,
  }).catch((err) => console.warn("[markInvoicePaid] webhook", err));

  revalidatePath("/app/deals");
  revalidatePath("/app/presupuestos");
  return { ok: true as const };
}
