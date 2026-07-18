import { createElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import type { LeadSource } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";
import { WelcomeEmail } from "@/emails/welcome";
import { BusinessApprovedEmail } from "@/emails/business-approved";
import { NewLeadEmail } from "@/emails/new-lead";
import { WeeklyLeadsEmail } from "@/emails/weekly-leads";
import { sanitizeUserText } from "@/lib/sanitize";

const from = "Konnect <notificaciones@kmd.agency>";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; email omitido");
    return null;
  }
  return new Resend(apiKey);
}

async function send(params: {
  to: string;
  subject: string;
  react: React.ReactElement;
  logTag: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] omitido (${params.logTag}):`, params.to);
    return;
  }

  try {
    const html = await render(params.react);
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html,
    });
  } catch (error) {
    console.error(`[email] Falló ${params.logTag}:`, error);
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string | null;
}) {
  const appUrl = getAppBaseUrl();
  await send({
    to: params.to,
    subject: "Bienvenido a Konnect",
    logTag: "bienvenida",
    react: createElement(WelcomeEmail, { name: params.name, appUrl }),
  });
}

export async function sendBusinessApprovedEmail(params: {
  to: string;
  businessName: string;
  slug: string;
}) {
  const profileUrl = `${getAppBaseUrl()}/negocio/${params.slug}`;
  await send({
    to: params.to,
    subject: "Tu negocio ya está publicado en Konnect",
    logTag: "aprobación",
    react: createElement(BusinessApprovedEmail, {
      businessName: sanitizeUserText(params.businessName, 120),
      profileUrl,
    }),
  });
}

const sourceLabels: Partial<Record<LeadSource, string>> = {
  DIRECTORY_FORM: "mensaje",
  QUOTE_REQUEST: "cotización",
};

export async function sendNewLeadEmail(params: {
  to: string;
  businessName: string;
  leadName: string;
  message: string | null;
  source: LeadSource;
}) {
  const leadsUrl = `${getAppBaseUrl()}/app/leads`;
  const kind = sourceLabels[params.source] ?? "lead";
  const message = sanitizeUserText(
    params.message?.trim() || "(sin mensaje)",
    280,
  );
  const leadName = sanitizeUserText(params.leadName, 120);

  await send({
    to: params.to,
    subject: `Nuevo lead: ${leadName} — ${message.slice(0, 60)}`,
    logTag: "nuevo lead",
    react: createElement(NewLeadEmail, {
      businessName: sanitizeUserText(params.businessName, 120),
      leadName,
      message,
      kind,
      leadsUrl,
    }),
  });
}

export async function sendWeeklyLeadsEmail(params: {
  to: string;
  businessName: string;
  totalLeads: number;
  bySource: { label: string; count: number }[];
}) {
  const leadsUrl = `${getAppBaseUrl()}/app/leads`;
  await send({
    to: params.to,
    subject: `Resumen semanal: ${params.totalLeads} leads — ${params.businessName}`,
    logTag: "resumen semanal",
    react: createElement(WeeklyLeadsEmail, {
      businessName: sanitizeUserText(params.businessName, 120),
      totalLeads: params.totalLeads,
      bySource: params.bySource,
      leadsUrl,
    }),
  });
}
