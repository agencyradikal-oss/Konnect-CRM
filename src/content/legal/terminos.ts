import {
  EFFECTIVE_DATE_EN,
  EFFECTIVE_DATE_ES,
  LEGAL_CONTACT,
  LEGAL_ENTITY,
  SITE_URL,
  type LegalDoc,
} from "./meta";

export const terminosEs: LegalDoc = {
  title: "Términos y condiciones",
  effectiveDate: EFFECTIVE_DATE_ES,
  effectiveLabel: "Vigente desde",
  counselNote:
    "Documento informativo de producto. Para asesoría legal específica, consulta a un abogado.",
  contactLabel: "Contacto",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "Estos Términos regulan el uso de Konnect™ (el “Servicio”), la plataforma de directorio público y CRM multi-tenant operada por KMD Agency LLC desde Atlanta, Georgia. Al crear una cuenta, publicar un negocio o usar el directorio, aceptas estos Términos.",
  sections: [
    {
      id: "servicio",
      title: "1. Descripción del Servicio",
      paragraphs: [
        "Konnect combina (a) un directorio público de negocios, (b) un CRM privado por negocio (leads, contactos, deals, tareas) y (c) “El Puente”: la captura automática de interacciones del perfil público como leads en el CRM, con seguimiento de origen.",
        "Algunas funciones dependen del plan (Free, Pro o Premium) descrito en /precios. Podemos modificar planes, límites y precios con aviso razonable.",
      ],
    },
    {
      id: "cuentas",
      title: "2. Cuentas y roles",
      paragraphs: [
        "Eres responsable de la confidencialidad de tus credenciales y de la actividad bajo tu cuenta. Los roles incluyen SUPER_ADMIN (operadores KMD), BUSINESS_OWNER y BUSINESS_STAFF.",
        "Debes proporcionar información veraz al registrar un negocio. Nos reservamos el derecho de aprobar, suspender o rechazar perfiles que incumplan estos Términos o la ley aplicable.",
      ],
    },
    {
      id: "contenido",
      title: "3. Contenido del negocio y del directorio",
      paragraphs: [
        "Tú conservas los derechos sobre el contenido que subes (textos, logos, fotos, horarios). Nos otorgas una licencia no exclusiva para alojarlo, mostrarlo y operar el Servicio (incluido CDN y almacenamiento).",
        "No debes publicar contenido ilegal, engañoso, ofensivo, que infrinja derechos de terceros, o spam. Las reseñas pueden moderarse antes de publicarse.",
      ],
      bullets: [
        "No suplantar a otras empresas ni usar marcas ajenas sin autorización.",
        "No recopilar datos de usuarios del directorio con fines ajenos al contacto legítimo de clientes.",
        "No interferir con la seguridad, rate limits o integridad del Servicio.",
      ],
    },
    {
      id: "leads",
      title: "4. Leads y El Puente",
      paragraphs: [
        "Las interacciones públicas (formularios, cotizaciones, click-to-call, WhatsApp) pueden generar leads en tu CRM. Eres el responsable del tratamiento de esos datos como negocio ante tus clientes potenciales (TCPA, CAN-SPAM y leyes estatales de privacidad cuando apliquen).",
        "Konnect facilita la captura y el almacenamiento; no garantiza volumen de leads ni cierres de venta. El plan Free puede limitar la visualización de leads aunque se guarden todos.",
      ],
    },
    {
      id: "pagos",
      title: "5. Pagos y suscripciones",
      paragraphs: [
        "Los cobros de planes de pago se procesan mediante Stripe. Al suscribirte, aceptas los términos de Stripe y la facturación recurrente hasta cancelar desde el portal de facturación.",
        "Salvo que la ley exija lo contrario, los cargos no son reembolsables una vez iniciado el período de facturación. Puedes cancelar para evitar renovaciones futuras.",
      ],
    },
    {
      id: "propiedad",
      title: "6. Propiedad intelectual",
      paragraphs: [
        "Konnect™, la marca, el software, el diseño y la documentación son propiedad de KMD Agency LLC o sus licenciantes. No puedes copiar, revender ni crear productos derivados del Servicio sin autorización escrita.",
      ],
    },
    {
      id: "api",
      title: "7. Integraciones y API",
      paragraphs: [
        "El acceso a APIs, webhooks o integraciones para desarrolladores puede estar sujeto a claves, cuotas y términos adicionales publicados en /developers. El uso abusivo puede resultar en suspensión.",
        "Si conectas Google Calendar, Maps o Google Business Profile, aceptas los términos de Google aplicables y autorizas el envío de datos de citas (p. ej. nombre, teléfono, dirección del cliente) a Google según el consentimiento que confirmes en /app/integraciones. Konnect es el sistema de verdad del CRM; Google es un canal operativo. Puedes revocar el acceso desconectando la integración.",
      ],
    },
    {
      id: "disclaimer",
      title: "8. Descargos de responsabilidad",
      paragraphs: [
        "El Servicio se ofrece “tal cual” y “según disponibilidad”. En la máxima medida permitida por la ley de Georgia y de EE. UU., no garantizamos disponibilidad ininterrumpida, ausencia de errores ni resultados comerciales específicos.",
        "No somos parte de las transacciones entre visitantes del directorio y los negocios listados.",
      ],
    },
    {
      id: "limite",
      title: "9. Limitación de responsabilidad",
      paragraphs: [
        "En la medida permitida por la ley, la responsabilidad total de KMD Agency LLC ante ti por reclamaciones relacionadas con el Servicio no excederá el mayor entre (a) los montos pagados por ti a Konnect en los 12 meses previos al reclamo, o (b) USD $100 si estás en plan Free.",
      ],
    },
    {
      id: "ley",
      title: "10. Ley aplicable",
      paragraphs: [
        `Estos Términos se rigen por las leyes del Estado de Georgia, EE. UU., sin conflicto de leyes. Los tribunales estatales o federales ubicados en el área metropolitana de Atlanta tendrán jurisdicción exclusiva, salvo que la ley del consumidor disponga otro foro.`,
        `Puedes contactarnos en ${LEGAL_CONTACT}. Sitio: ${SITE_URL}.`,
      ],
    },
    {
      id: "cambios",
      title: "11. Cambios",
      paragraphs: [
        "Podemos actualizar estos Términos. La fecha de vigencia se indica arriba. El uso continuado del Servicio después de cambios materiales constituye aceptación, salvo que la ley exija consentimiento explícito.",
      ],
    },
  ],
};

export const terminosEn: LegalDoc = {
  title: "Terms of Service",
  effectiveDate: EFFECTIVE_DATE_EN,
  effectiveLabel: "Effective",
  counselNote:
    "Product information document. For specific legal advice, consult an attorney.",
  contactLabel: "Contact",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "These Terms govern use of Konnect™ (the “Service”), the public directory and multi-tenant CRM operated by KMD Agency LLC from Atlanta, Georgia. By creating an account, listing a business, or using the directory, you agree to these Terms.",
  sections: [
    {
      id: "servicio",
      title: "1. Service description",
      paragraphs: [
        "Konnect combines (a) a public business directory, (b) a private per-business CRM (leads, contacts, deals, tasks), and (c) “El Puente”: automatic capture of public-profile interactions as CRM leads with source tracking.",
        "Some features depend on your plan (Free, Pro, or Premium) described at /precios. We may change plans, limits, and pricing with reasonable notice.",
      ],
    },
    {
      id: "cuentas",
      title: "2. Accounts and roles",
      paragraphs: [
        "You are responsible for credential confidentiality and activity under your account. Roles include SUPER_ADMIN (KMD operators), BUSINESS_OWNER, and BUSINESS_STAFF.",
        "You must provide accurate information when registering a business. We may approve, suspend, or reject listings that violate these Terms or applicable law.",
      ],
    },
    {
      id: "contenido",
      title: "3. Business and directory content",
      paragraphs: [
        "You retain rights to content you upload. You grant us a non-exclusive license to host, display, and operate the Service (including CDN and storage).",
        "Do not post illegal, misleading, infringing, or spam content. Reviews may be moderated before publication.",
      ],
      bullets: [
        "Do not impersonate other businesses or misuse third-party trademarks.",
        "Do not harvest directory user data for unrelated purposes.",
        "Do not interfere with security, rate limits, or Service integrity.",
      ],
    },
    {
      id: "leads",
      title: "4. Leads and El Puente",
      paragraphs: [
        "Public interactions (forms, quotes, click-to-call, WhatsApp) may create CRM leads. You are responsible for how you handle that data toward prospects (including TCPA, CAN-SPAM, and applicable state privacy laws).",
        "Konnect enables capture and storage; it does not guarantee lead volume or closed sales. Free plans may limit lead visibility even when all leads are stored.",
      ],
    },
    {
      id: "pagos",
      title: "5. Payments and subscriptions",
      paragraphs: [
        "Paid plans are processed by Stripe. By subscribing you agree to Stripe’s terms and recurring billing until you cancel via the billing portal.",
        "Unless required by law, fees are non-refundable after a billing period starts. You may cancel to stop future renewals.",
      ],
    },
    {
      id: "propiedad",
      title: "6. Intellectual property",
      paragraphs: [
        "Konnect™, branding, software, design, and docs are owned by KMD Agency LLC or its licensors. You may not copy, resell, or create derivative products without written permission.",
      ],
    },
    {
      id: "api",
      title: "7. Integrations and API",
      paragraphs: [
        "API, webhook, or developer access may require keys, quotas, and additional terms at /developers. Abuse may lead to suspension.",
        "If you connect Google Calendar, Maps, or Google Business Profile, you accept applicable Google terms and authorize sending appointment data (e.g. client name, phone, address) to Google per the consent you confirm in /app/integraciones. Konnect remains the CRM source of truth; Google is an operational channel. You may revoke access by disconnecting the integration.",
      ],
    },
    {
      id: "disclaimer",
      title: "8. Disclaimers",
      paragraphs: [
        "The Service is provided “as is” and “as available.” To the fullest extent permitted by Georgia and U.S. law, we disclaim warranties of uninterrupted availability, error-free operation, or specific business results.",
        "We are not a party to transactions between directory visitors and listed businesses.",
      ],
    },
    {
      id: "limite",
      title: "9. Limitation of liability",
      paragraphs: [
        "To the extent permitted by law, KMD Agency LLC’s total liability to you for claims related to the Service will not exceed the greater of (a) amounts you paid Konnect in the 12 months before the claim, or (b) USD $100 if you are on Free.",
      ],
    },
    {
      id: "ley",
      title: "10. Governing law",
      paragraphs: [
        `These Terms are governed by the laws of the State of Georgia, USA, without conflict-of-law rules. Courts in the Atlanta metro area have exclusive jurisdiction unless consumer law requires otherwise.`,
        `Contact: ${LEGAL_CONTACT}. Site: ${SITE_URL}.`,
      ],
    },
    {
      id: "cambios",
      title: "11. Changes",
      paragraphs: [
        "We may update these Terms. The effective date is shown above. Continued use after material changes constitutes acceptance unless law requires explicit consent.",
      ],
    },
  ],
};
