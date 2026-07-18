import { Resend } from "resend";
import type { LeadSource } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";

const from = "Konnect <notificaciones@kmd.agency>";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; email omitido");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Envía email transaccional vía Resend.
 * Si RESEND_API_KEY no está configurada, loguea y no falla.
 */
export async function sendBusinessApprovedEmail(params: {
  to: string;
  businessName: string;
  slug: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] omitido (aprobación):", params.to);
    return;
  }

  const profileUrl = `${getAppBaseUrl()}/negocio/${params.slug}`;

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: "Tu negocio ya está publicado en Konnect",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h1 style="color:#0e1b1a">¡Felicidades!</h1>
          <p><strong>${params.businessName}</strong> fue aprobado y ya está publicado en el directorio de Konnect.</p>
          <p>
            <a href="${profileUrl}"
               style="display:inline-block;background:#31C9C0;color:#06302d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Ver mi perfil público
            </a>
          </p>
          <p style="color:#5c6b69;font-size:14px">
            Cada llamada, WhatsApp o mensaje desde tu perfil se registra
            automáticamente como lead en tu CRM.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Falló el envío de aprobación:", error);
  }
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
  const resend = getResend();
  if (!resend) {
    console.warn("[email] omitido (nuevo lead):", params.to);
    return;
  }

  const leadsUrl = `${getAppBaseUrl()}/app/leads`;
  const kind = sourceLabels[params.source] ?? "lead";
  const preview = params.message?.trim()
    ? params.message.trim().slice(0, 280)
    : "(sin mensaje)";

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: `Nuevo lead desde tu perfil de Konnect: ${params.leadName} — ${preview.slice(0, 60)}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h1 style="color:#0e1b1a;font-size:20px">Nuevo lead en Konnect</h1>
          <p>
            <strong>${params.leadName}</strong> te envió una solicitud de
            <strong>${kind}</strong> desde tu perfil de
            <strong>${params.businessName}</strong>.
          </p>
          <blockquote style="margin:16px 0;padding:12px 16px;background:#f4f7f7;border-left:4px solid #31C9C0;color:#0e1b1a">
            ${preview.replace(/</g, "&lt;")}
          </blockquote>
          <p>
            <a href="${leadsUrl}"
               style="display:inline-block;background:#31C9C0;color:#06302d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Ver lead en el CRM
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Falló el envío de nuevo lead:", error);
  }
}
