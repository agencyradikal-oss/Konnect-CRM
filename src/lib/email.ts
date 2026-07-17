import { Resend } from "resend";

const from = "Konnect <notificaciones@kmd.agency>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Envía email transaccional vía Resend.
 * Si RESEND_API_KEY no está configurada, loguea y no falla.
 */
export async function sendBusinessApprovedEmail(params: {
  to: string;
  businessName: string;
  slug: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; email omitido:", params);
    return;
  }

  const resend = new Resend(apiKey);
  const profileUrl = `${appUrl}/negocio/${params.slug}`;

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: "Tu negocio ya está publicado en Konnect",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h1 style="color:#0e1b1a">¡Felicidades! 🎉</h1>
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
