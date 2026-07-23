"use server";

import { z } from "zod";
import { LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertLeadFormRateLimit } from "@/lib/rate-limit";
import { sendNewLeadEmail } from "@/lib/email";
import { sanitizeUserText } from "@/lib/sanitize";
import { dispatchLeadCreatedWebhook } from "@/lib/outbound-webhook";
import {
  bridgeFormSourceSchema,
  bridgeLeadDataSchema,
} from "@/lib/bridge-schemas";

/**
 * El Puente: toda interacción del perfil público se registra
 * como Lead en el CRM del negocio, con source tracking.
 */

export async function createLeadFromDirectory(
  businessSlug: string,
  data: unknown,
  source: unknown,
) {
  const slug = z.string().min(1).parse(businessSlug);
  const leadSource = bridgeFormSourceSchema.parse(source);
  const parsed = bridgeLeadDataSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      status: true,
      name: true,
      email: true,
      users: {
        where: { role: { in: ["BUSINESS_OWNER", "BUSINESS_STAFF"] } },
        select: { email: true },
        take: 3,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!business || business.status !== "ACTIVE") {
    return { ok: false as const, error: "Negocio no disponible." };
  }

  const rate = await assertLeadFormRateLimit();
  if (!rate.ok) return rate;

  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: sanitizeUserText(parsed.data.name, 120),
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      message: parsed.data.message
        ? sanitizeUserText(parsed.data.message, 2000)
        : null,
      source: leadSource,
      status: "NEW",
    },
  });

  const notifyTo =
    business.email?.trim() ||
    business.users.map((u) => u.email).find(Boolean) ||
    null;

  if (notifyTo) {
    void sendNewLeadEmail({
      to: notifyTo,
      businessName: business.name,
      leadName: lead.name,
      message: lead.message,
      source: leadSource,
    }).catch((err) => console.error("[bridge] email lead:", err));
  }

  void dispatchLeadCreatedWebhook({
    businessId: business.id,
    businessSlug: business.slug,
    lead,
  }).catch((err) => console.error("[bridge] webhook lead:", err));

  return { ok: true as const, leadId: lead.id };
}

const clickTypeSchema = z.enum(["CLICK_CALL", "CLICK_WHATSAPP"]);

/** Click-to-call / WhatsApp: lead mínimo, fire-and-forget desde el cliente. */
export async function trackContactClick(
  businessSlug: string,
  type: unknown,
) {
  const slug = z.string().min(1).parse(businessSlug);
  const source = clickTypeSchema.parse(type) as
    | typeof LeadSource.CLICK_CALL
    | typeof LeadSource.CLICK_WHATSAPP;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, slug: true, status: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false as const };
  }

  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Visitante del directorio",
      source,
      status: "NEW",
      message: null,
    },
  });

  void dispatchLeadCreatedWebhook({
    businessId: business.id,
    businessSlug: business.slug,
    lead,
  }).catch((err) => console.error("[bridge] webhook click:", err));

  return { ok: true as const };
}
