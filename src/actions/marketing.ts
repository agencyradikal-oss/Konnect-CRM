"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getBusinessPlanLimits } from "@/lib/plans";
import { sendMarketingFollowUpEmail } from "@/lib/email";
import {
  getTemplate,
  renderTemplate,
  templatesForSet,
} from "@/lib/marketing/templates";

const channelSchema = z.enum(["email", "whatsapp", "sms"]);

const logSchema = z.object({
  channel: channelSchema,
  templateKey: z.string().min(1).max(64),
  contactId: z.string().min(1).optional().nullable(),
  leadId: z.string().min(1).optional().nullable(),
  dealId: z.string().min(1).optional().nullable(),
  toValue: z.string().max(200).optional().nullable(),
});

const emailSchema = z.object({
  templateKey: z.string().min(1).max(64),
  contactId: z.string().min(1).optional().nullable(),
  leadId: z.string().min(1).optional().nullable(),
  toEmail: z.string().email(),
  recipientName: z.string().min(1).max(120),
});

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

async function emailsSentThisMonth(businessId: string): Promise<number> {
  return prisma.outreachLog.count({
    where: {
      businessId,
      channel: "email",
      createdAt: { gte: startOfMonth() },
    },
  });
}

export async function logOutreach(input: unknown) {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getBusinessPlanLimits(business);
  if (!limits.marketingCenter) {
    return { ok: false as const, error: "Marketing Center no disponible." };
  }

  const data = logSchema.parse(input);
  const allowed = templatesForSet(limits.followUpTemplateSet);
  if (!allowed.some((t) => t.key === data.templateKey)) {
    return { ok: false as const, error: "Plantilla no disponible en tu plan." };
  }

  if (data.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, businessId },
      select: { id: true },
    });
    if (!lead) return { ok: false as const, error: "Lead no encontrado." };
  }
  if (data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, businessId },
      select: { id: true },
    });
    if (!contact) return { ok: false as const, error: "Contacto no encontrado." };
  }

  await prisma.outreachLog.create({
    data: {
      businessId,
      channel: data.channel,
      templateKey: data.templateKey,
      contactId: data.contactId || null,
      leadId: data.leadId || null,
      dealId: data.dealId || null,
      toValue: data.toValue || null,
    },
  });

  if (data.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: data.dealId, businessId },
      select: { id: true },
    });
    if (deal) {
      const tpl = getTemplate(data.templateKey);
      await prisma.activity.create({
        data: {
          businessId,
          dealId: deal.id,
          type: data.channel === "email" ? "email" : "note",
          content: `Seguimiento (${data.channel}): ${tpl?.label ?? data.templateKey}`,
        },
      });
    }
  }

  revalidatePath("/app/marketing");
  return { ok: true as const };
}

export async function sendFollowUpEmail(input: unknown) {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getBusinessPlanLimits(business);
  if (!limits.marketingCenter) {
    return { ok: false as const, error: "Marketing Center no disponible." };
  }

  const data = emailSchema.parse(input);
  const allowed = templatesForSet(limits.followUpTemplateSet);
  const template = allowed.find((t) => t.key === data.templateKey);
  if (!template) {
    return { ok: false as const, error: "Plantilla no disponible en tu plan." };
  }

  const used = await emailsSentThisMonth(businessId);
  if (used >= limits.followUpEmailsPerMonth) {
    return {
      ok: false as const,
      error: `Cupo mensual de emails alcanzado (${limits.followUpEmailsPerMonth}). Actualiza tu plan o espera al próximo mes.`,
    };
  }

  let dealId: string | null = null;
  if (data.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, businessId },
      select: { id: true, dealId: true },
    });
    if (!lead) return { ok: false as const, error: "Lead no encontrado." };
    dealId = lead.dealId;
  }
  if (data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, businessId },
      select: { id: true },
    });
    if (!contact) return { ok: false as const, error: "Contacto no encontrado." };
  }

  const { subject, body } = renderTemplate(template, {
    nombre: data.recipientName,
    negocio: business.name,
  });

  const sent = await sendMarketingFollowUpEmail({
    to: data.toEmail,
    businessName: business.name,
    subject,
    body,
  });

  if (!sent) {
    return {
      ok: false as const,
      error: "No se pudo enviar el email. Revisa RESEND_API_KEY o inténtalo luego.",
    };
  }

  await prisma.outreachLog.create({
    data: {
      businessId,
      channel: "email",
      templateKey: data.templateKey,
      contactId: data.contactId || null,
      leadId: data.leadId || null,
      dealId,
      toValue: data.toEmail,
    },
  });

  if (dealId) {
    await prisma.activity.create({
      data: {
        businessId,
        dealId,
        type: "email",
        content: `Seguimiento email: ${template.label} → ${data.toEmail}`,
      },
    });
  }

  revalidatePath("/app/marketing");
  if (dealId) revalidatePath("/app/deals");
  return {
    ok: true as const,
    remaining: Math.max(0, limits.followUpEmailsPerMonth - used - 1),
  };
}
