"use server";

import { z } from "zod";
import { LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * El Puente: toda interacción del perfil público se registra
 * como Lead en el CRM del negocio, con source tracking.
 */

const contactSchema = z.object({
  businessId: z.string().min(1),
  source: z.enum([LeadSource.DIRECTORY_FORM, LeadSource.QUOTE_REQUEST]),
  name: z.string().min(1, "Tu nombre es requerido").max(120),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z.string().min(1, "Escribe un mensaje").max(2000),
});

export async function createLeadFromForm(input: unknown) {
  const data = contactSchema.parse(input);

  const business = await prisma.business.findUnique({
    where: { id: data.businessId },
    select: { id: true, status: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false as const, error: "Negocio no disponible." };
  }

  await prisma.lead.create({
    data: {
      businessId: business.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
      source: data.source,
    },
  });

  return { ok: true as const };
}

const clickSchema = z.object({
  businessId: z.string().min(1),
  source: z.enum([LeadSource.CLICK_CALL, LeadSource.CLICK_WHATSAPP]),
});

/** Click-to-call / WhatsApp: lead anónimo con source tracking. */
export async function trackClickInteraction(input: unknown) {
  const data = clickSchema.parse(input);

  const business = await prisma.business.findUnique({
    where: { id: data.businessId },
    select: { id: true, status: true },
  });
  if (!business || business.status !== "ACTIVE") return { ok: false as const };

  await prisma.lead.create({
    data: {
      businessId: business.id,
      name: data.source === LeadSource.CLICK_CALL ? "Llamada desde el perfil" : "WhatsApp desde el perfil",
      source: data.source,
      message: null,
    },
  });

  return { ok: true as const };
}
