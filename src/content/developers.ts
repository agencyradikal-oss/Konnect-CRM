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
        "Hay dos capas distintas: (1) Stripe Billing — Konnect cobra al negocio por el plan Free/Pro/Premium; (2) integraciones del negocio — webhooks hacia Zapier/Make, Square, QuickBooks u otros sistemas.",
        "Configura tu webhook de salida en /app/integraciones. La API REST de lectura está en early access.",
      ],
    },
    {
      id: "stripe-billing",
      title: "Stripe Billing (suscripción Konnect)",
      body: [
        "Ya en producción: Checkout + Customer Portal + webhook firmado que actualiza Business.plan.",
        "Variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM. Endpoint: POST /api/webhooks/stripe.",
        "Esto NO es Stripe Connect ni cobro a clientes finales del directorio. El dueño gestiona su plan en /app/plan o /app/integraciones.",
      ],
    },
    {
      id: "webhooks",
      title: "Webhooks de salida (leads → Square / QuickBooks / Zapier)",
      body: [
        "Cuando un lead se crea vía El Puente, Konnect hace POST a tu URL (si está habilitada en /app/integraciones).",
        "Firma: header X-Konnect-Signature = HMAC-SHA256 hex del body con tu webhook secret. También enviamos X-Konnect-Event: lead.created. Responde 2xx en < 5s.",
        "Camino recomendado hoy: Konnect webhook → Zapier/Make → Square o QuickBooks Online (crear cliente/factura). OAuth nativo Square/QB es roadmap (Fase 2).",
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
      id: "square-qb",
      title: "Square y QuickBooks",
      body: [
        "Square: usa el webhook lead.created en Zapier (“Catch Hook”) y crea Customer/Invoice en Square. No hay OAuth nativo en Konnect todavía.",
        "QuickBooks Online: mismo flujo — webhook → Make/Zapier → Create Customer / Estimate. Solicita early access OAuth a developers@kmd.agency si necesitas sync nativo.",
        "Evento futuro (roadmap): deal.won para facturar solo deals cerrados.",
      ],
    },
    {
      id: "puente",
      title: "El Puente (entrada pública)",
      body: [
        "Sources que disparan lead.created: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP (también MANUAL / IMPORT / REFERRAL desde el CRM).",
        "No necesitas API para capturar leads del perfil público: los formularios y clicks ya crean el lead y, si hay webhook, lo reenvían.",
      ],
    },
    {
      id: "auth",
      title: "Autenticación API (próximamente)",
      body: [
        "Los partners usarán API keys por negocio (Authorization: Bearer kn_live_…). Nunca embeds keys en frontends públicos.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads" \\
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
        "Two distinct layers: (1) Stripe Billing — Konnect charges the business for Free/Pro/Premium; (2) business integrations — outbound webhooks to Zapier/Make, Square, QuickBooks, or other systems.",
        "Configure your outbound webhook at /app/integraciones. The read REST API is in early access.",
      ],
    },
    {
      id: "stripe-billing",
      title: "Stripe Billing (Konnect subscription)",
      body: [
        "In production: Checkout + Customer Portal + signed webhook that updates Business.plan.",
        "Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM. Endpoint: POST /api/webhooks/stripe.",
        "This is NOT Stripe Connect and not charging directory end-customers. Owners manage plans at /app/plan or /app/integraciones.",
      ],
    },
    {
      id: "webhooks",
      title: "Outbound webhooks (leads → Square / QuickBooks / Zapier)",
      body: [
        "When a lead is created via El Puente, Konnect POSTs to your URL (if enabled in /app/integraciones).",
        "Signature: X-Konnect-Signature = hex HMAC-SHA256 of the body with your webhook secret. Also X-Konnect-Event: lead.created. Return 2xx within 5s.",
        "Recommended path today: Konnect webhook → Zapier/Make → Square or QuickBooks Online. Native Square/QB OAuth is Phase 2 roadmap.",
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
      id: "square-qb",
      title: "Square and QuickBooks",
      body: [
        "Square: point lead.created at a Zapier Catch Hook and create Customer/Invoice in Square. No native OAuth in Konnect yet.",
        "QuickBooks Online: same flow — webhook → Make/Zapier → Create Customer / Estimate. Request native OAuth early access at developers@kmd.agency.",
        "Future event (roadmap): deal.won to invoice only closed deals.",
      ],
    },
    {
      id: "puente",
      title: "El Puente (public intake)",
      body: [
        "Sources that fire lead.created: DIRECTORY_FORM | QUOTE_REQUEST | CLICK_CALL | CLICK_WHATSAPP (also MANUAL / IMPORT / REFERRAL from the CRM).",
        "You do not need an API to capture public-profile leads — forms and clicks create the lead and forward it when a webhook is configured.",
      ],
    },
    {
      id: "auth",
      title: "API authentication (coming soon)",
      body: [
        "Partners will use per-business API keys (Authorization: Bearer kn_live_…). Never embed keys in public frontends.",
      ],
      code: `curl -X GET "${SITE_URL}/api/v1/leads" \\
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
