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
        "Hay dos capas distintas: (1) suscripción Konnect al negocio (planes Free/Pro/Premium); (2) integraciones del negocio — webhooks hacia Zapier/Make, Square, QuickBooks u otros sistemas.",
        "Configura tu webhook de salida en /app/integraciones. La API REST de lectura está en early access.",
      ],
    },
    {
      id: "subscription",
      title: "Planes Konnect (suscripción del negocio)",
      body: [
        "Konnect cobra al negocio por el plan Free/Pro/Premium — no a los visitantes del directorio ni vía Stripe Connect.",
        "Ver /precios. El dueño gestiona la suscripción en /app/plan tras iniciar sesión.",
      ],
    },
    {
      id: "webhooks",
      title: "Webhooks de salida (leads y presupuestos → Zapier)",
      body: [
        "Cuando ocurre un evento, Konnect hace POST a tu URL (si está habilitada en /app/integraciones).",
        "Firma: header X-Konnect-Signature = HMAC-SHA256 hex del body con tu webhook secret. También X-Konnect-Event. Responde 2xx en < 5s.",
        "Eventos: lead.created | estimate.accepted | invoice.created | invoice.paid. Camino típico: webhook → Zapier/Make → Square o QuickBooks.",
      ],
      code: `{
  "id": "evt_...",
  "type": "lead.created",
  "created_at": "2026-07-18T16:00:00.000Z",
  "data": {
    "lead_id": "clx...",
    "business_id": "clx...",
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
      id: "estimates",
      title: "Presupuestos y facturas (nativos)",
      body: [
        "En Pro/Premium puedes crear presupuestos en un deal, enviarlos por email o WhatsApp (enlace /p/{token}) y el cliente puede aceptar.",
        "Al aceptar se crea una factura PENDING; el dueño puede marcarla pagada. Cobro con tarjeta nativo (Stripe Connect / Square OAuth) es roadmap.",
        "Webhooks útiles: estimate.accepted, invoice.created, invoice.paid — para crear Invoice en Square/QB vía Zapier.",
      ],
      code: `{
  "id": "evt_..._accepted",
  "type": "estimate.accepted",
  "created_at": "2026-07-25T16:00:00.000Z",
  "data": {
    "estimate_id": "clx...",
    "invoice_id": "clx...",
    "business_id": "clx...",
    "business_slug": "all-in-remodeling",
    "deal_id": "clx...",
    "number": 12,
    "total": 2500,
    "currency": "USD"
  }
}`,
      codeLang: "json",
    },
    {
      id: "square-qb",
      title: "Square y QuickBooks",
      body: [
        "Square: usa lead.created o estimate.accepted / invoice.created en Zapier (“Catch Hook”) y crea Customer/Invoice en Square.",
        "QuickBooks Online: mismo flujo — webhook → Make/Zapier → Create Customer / Estimate / Invoice.",
        "OAuth nativo Square/QB es roadmap (Fase 2).",
      ],
    },
    {
      id: "puente",
      title: "El Puente (entrada pública)",
      body: [
        "Sources que disparan lead.created: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP | BOOKING (también MANUAL / IMPORT / REFERRAL desde el CRM).",
        "No necesitas API para capturar leads del perfil público: los formularios y clicks ya crean el lead y, si hay webhook, lo reenvían.",
      ],
    },
    {
      id: "auth",
      title: "Autenticación API",
      body: [
        "Crea keys en /app/integraciones (dueño). Header: Authorization: Bearer kn_live_…. La key completa solo se muestra al crearla; se guarda hasheada (SHA-256).",
        "Endpoint actual: GET /api/v1/leads?status=&source=&limit=50 (máx 100). Responde { data: Lead[] }.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads?limit=20" \\
  -H "Authorization: Bearer kn_live_xxx" \\
  -H "Accept: application/json"`,
      codeLang: "bash",
    },
    {
      id: "platforms",
      title: "Otras plataformas",
      body: [
        "Zapier/Make, WhatsApp Business API, Google Sheets, HubSpot/Salesforce, Twilio SMS. Conector oficial: escríbenos para sandbox compartido.",
      ],
    },
    {
      id: "limits",
      title: "Límites y buenas prácticas",
      body: [
        "Verifica siempre X-Konnect-Signature. No hagas scraping del directorio. Sanitiza PII. Cumple TCPA/CAN-SPAM al contactar leads.",
      ],
    },
    {
      id: "contacto",
      title: "Solicitar acceso",
      body: [
        `Email: ${DEVELOPERS_CONTACT} — indica Square, QuickBooks, webhooks o API de lectura.`,
        "Asunto sugerido: [Konnect API] Early access.",
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
        "Two distinct layers: (1) Konnect subscription for the business (Free/Pro/Premium plans); (2) business integrations — outbound webhooks to Zapier/Make, Square, QuickBooks, or other systems.",
        "Configure your outbound webhook at /app/integraciones. The read REST API is in early access.",
      ],
    },
    {
      id: "subscription",
      title: "Konnect plans (business subscription)",
      body: [
        "Konnect bills the business for Free/Pro/Premium — not directory visitors, and not via Stripe Connect.",
        "See /precios. Owners manage the subscription at /app/plan after signing in.",
      ],
    },
    {
      id: "webhooks",
      title: "Outbound webhooks (leads & estimates → Zapier)",
      body: [
        "When an event occurs, Konnect POSTs to your URL (if enabled in /app/integraciones).",
        "Signature: X-Konnect-Signature = hex HMAC-SHA256 of the body with your webhook secret. Also X-Konnect-Event. Return 2xx within 5s.",
        "Events: lead.created | estimate.accepted | invoice.created | invoice.paid. Typical path: webhook → Zapier/Make → Square or QuickBooks.",
      ],
      code: `{
  "id": "evt_...",
  "type": "lead.created",
  "created_at": "2026-07-18T16:00:00.000Z",
  "data": {
    "lead_id": "clx...",
    "business_id": "clx...",
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
      id: "estimates",
      title: "Native estimates & invoices",
      body: [
        "On Pro/Premium you can create estimates on a deal, send them by email or WhatsApp (/p/{token}), and the client can accept.",
        "Accepting creates a PENDING invoice; the owner can mark it paid. Native card capture (Stripe Connect / Square OAuth) is roadmap.",
        "Useful webhooks: estimate.accepted, invoice.created, invoice.paid — to create Square/QB invoices via Zapier.",
      ],
      code: `{
  "id": "evt_..._accepted",
  "type": "estimate.accepted",
  "created_at": "2026-07-25T16:00:00.000Z",
  "data": {
    "estimate_id": "clx...",
    "invoice_id": "clx...",
    "business_id": "clx...",
    "business_slug": "all-in-remodeling",
    "deal_id": "clx...",
    "number": 12,
    "total": 2500,
    "currency": "USD"
  }
}`,
      codeLang: "json",
    },
    {
      id: "square-qb",
      title: "Square and QuickBooks",
      body: [
        "Square: point lead.created or estimate.accepted / invoice.created at a Zapier Catch Hook and create Customer/Invoice.",
        "QuickBooks Online: same flow — webhook → Make/Zapier → Create Customer / Estimate / Invoice.",
        "Native Square/QB OAuth is Phase 2 roadmap.",
      ],
    },
    {
      id: "puente",
      title: "El Puente (public intake)",
      body: [
        "Sources that fire lead.created: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP | BOOKING (also MANUAL / IMPORT / REFERRAL from the CRM).",
        "You do not need an API to capture public-profile leads — forms and clicks create the lead and forward it when a webhook is configured.",
      ],
    },
    {
      id: "auth",
      title: "API authentication",
      body: [
        "Create keys in /app/integraciones (owner). Header: Authorization: Bearer kn_live_…. The full key is shown only once; we store a SHA-256 hash.",
        "Current endpoint: GET /api/v1/leads?status=&source=&limit=50 (max 100). Returns { data: Lead[] }.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads?limit=20" \\
  -H "Authorization: Bearer kn_live_xxx" \\
  -H "Accept: application/json"`,
      codeLang: "bash",
    },
    {
      id: "platforms",
      title: "Other platforms",
      body: [
        "Zapier/Make, WhatsApp Business API, Google Sheets, HubSpot/Salesforce, Twilio SMS. Building an official connector? Email us for a shared sandbox.",
      ],
    },
    {
      id: "limits",
      title: "Limits & best practices",
      body: [
        "Always verify X-Konnect-Signature. Do not scrape the directory. Sanitize PII. Follow TCPA/CAN-SPAM when contacting leads.",
      ],
    },
    {
      id: "contacto",
      title: "Request access",
      body: [
        `Email: ${DEVELOPERS_CONTACT} — mention Square, QuickBooks, webhooks, or read API.`,
        "Suggested subject: [Konnect API] Early access.",
      ],
    },
  ] satisfies DevSection[],
};
