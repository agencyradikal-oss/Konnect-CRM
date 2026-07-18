import { DEVELOPERS_CONTACT, SITE_URL } from "@/content/legal/meta";

export type DevSection = {
  id: string;
  title: string;
  body: string[];
  code?: string;
  codeLang?: string;
};

export const developersEs = {
  title: "Developers",
  subtitle:
    "Integra Konnect con tu app, CRM externo o automatizaciones. El Puente ya captura leads en la plataforma; aquí documentamos cómo conectar hacia afuera.",
  statusBadge: "API pública en early access",
  sections: [
    {
      id: "overview",
      title: "Visión general",
      body: [
        "Hoy Konnect expone integraciones internas de producción (Stripe webhooks, Resend, Vercel Blob, Auth.js) y un camino de partners para enviar/recibir eventos de leads.",
        "La API REST pública para terceros está en early access: solicita acceso y te emitimos credenciales de sandbox.",
      ],
    },
    {
      id: "auth",
      title: "Autenticación (próximamente)",
      body: [
        "Los partners usarán API keys por negocio o por organización (header Authorization: Bearer <key>). Las keys se podrán rotar desde el panel admin / partners.",
        "Nunca embeds keys en frontends públicos. Usa solo servidor a servidor.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads" \\
  -H "Authorization: Bearer kn_live_xxx" \\
  -H "Accept: application/json"`,
      codeLang: "bash",
    },
    {
      id: "webhooks",
      title: "Webhooks de salida (leads)",
      body: [
        "Cuando un lead se crea vía El Puente (formulario, cotización, click-to-call, WhatsApp), Konnect puede POST-ear un evento firmado a tu endpoint.",
        "Firma: header X-Konnect-Signature (HMAC-SHA256 del body con tu webhook secret). Responde 2xx en menos de 5s; reintentamos con backoff.",
      ],
      code: `{
  "id": "evt_...",
  "type": "lead.created",
  "created_at": "2026-07-18T16:00:00.000Z",
  "data": {
    "lead_id": "clx...",
    "business_slug": "granitos-el-aguila",
    "name": "María Pérez",
    "email": "maria@email.com",
    "phone": "+14045551212",
    "message": "Necesito cotización de quartz",
    "source": "QUOTE_REQUEST"
  }
}`,
      codeLang: "json",
    },
    {
      id: "puente",
      title: "El Puente (entrada pública)",
      body: [
        "No necesitas API para capturar leads del perfil público: los formularios y clicks ya crean leads en el CRM del negocio.",
        "Sources: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP | MANUAL | IMPORT | REFERRAL.",
      ],
    },
    {
      id: "platforms",
      title: "Plataformas y partners",
      body: [
        "Casos de uso típicos: Zapier/Make (vía webhook), WhatsApp Business API propia, Google Sheets, CRMs externos (HubSpot, Salesforce), SMS (Twilio).",
        "Si fabricas un conector oficial, escríbenos para co-marketing y sandbox compartido.",
      ],
    },
    {
      id: "limits",
      title: "Límites y buenas prácticas",
      body: [
        "Respeta rate limits (se documentarán por plan). No hagas scraping del directorio. Sanitiza PII en tus sistemas. Cumple TCPA/CAN-SPAM al contactar leads.",
      ],
    },
    {
      id: "contacto",
      title: "Solicitar acceso",
      body: [
        `Email: ${DEVELOPERS_CONTACT} — incluye nombre de empresa, caso de uso y si necesitas webhooks de salida, API de lectura de leads, o ambos.`,
        "Asunto sugerido: [Konnect API] Solicitud early access.",
      ],
    },
  ] satisfies DevSection[],
};

export const developersEn = {
  title: "Developers",
  subtitle:
    "Connect Konnect to your app, external CRM, or automations. El Puente already captures leads inside the platform; here is how to integrate outward.",
  statusBadge: "Public API — early access",
  sections: [
    {
      id: "overview",
      title: "Overview",
      body: [
        "Konnect already runs production integrations (Stripe webhooks, Resend, Vercel Blob, Auth.js) and a partner path for lead events.",
        "The third-party public REST API is in early access — request access and we will issue sandbox credentials.",
      ],
    },
    {
      id: "auth",
      title: "Authentication (coming soon)",
      body: [
        "Partners will use per-business or org API keys (Authorization: Bearer <key>). Keys will be rotatable from the admin/partners console.",
        "Never embed keys in public frontends. Server-to-server only.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads" \\
  -H "Authorization: Bearer kn_live_xxx" \\
  -H "Accept: application/json"`,
      codeLang: "bash",
    },
    {
      id: "webhooks",
      title: "Outbound webhooks (leads)",
      body: [
        "When a lead is created via El Puente, Konnect can POST a signed event to your endpoint.",
        "Signature: X-Konnect-Signature header (HMAC-SHA256 of the body with your webhook secret). Return 2xx within 5s; we retry with backoff.",
      ],
      code: `{
  "id": "evt_...",
  "type": "lead.created",
  "created_at": "2026-07-18T16:00:00.000Z",
  "data": {
    "lead_id": "clx...",
    "business_slug": "granitos-el-aguila",
    "name": "Maria Perez",
    "email": "maria@email.com",
    "phone": "+14045551212",
    "message": "Need a quartz quote",
    "source": "QUOTE_REQUEST"
  }
}`,
      codeLang: "json",
    },
    {
      id: "puente",
      title: "El Puente (public intake)",
      body: [
        "You do not need an API to capture public-profile leads — forms and clicks already create CRM leads.",
        "Sources: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP | MANUAL | IMPORT | REFERRAL.",
      ],
    },
    {
      id: "platforms",
      title: "Platforms & partners",
      body: [
        "Typical use cases: Zapier/Make (via webhook), your WhatsApp Business API, Google Sheets, external CRMs (HubSpot, Salesforce), SMS (Twilio).",
        "Building an official connector? Email us for co-marketing and a shared sandbox.",
      ],
    },
    {
      id: "limits",
      title: "Limits & best practices",
      body: [
        "Respect rate limits (documented per plan). Do not scrape the directory. Sanitize PII in your systems. Follow TCPA/CAN-SPAM when contacting leads.",
      ],
    },
    {
      id: "contacto",
      title: "Request access",
      body: [
        `Email: ${DEVELOPERS_CONTACT} — include company name, use case, and whether you need outbound webhooks, lead read API, or both.`,
        "Suggested subject: [Konnect API] Early access request.",
      ],
    },
  ] satisfies DevSection[],
};
