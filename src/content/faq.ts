export type FaqItem = { q: string; a: string };
export type FaqGroup = { title: string; items: FaqItem[] };

export const faqEs: {
  title: string;
  subtitle: string;
  groups: FaqGroup[];
} = {
  title: "Preguntas frecuentes",
  subtitle:
    "Respuestas claras sobre el directorio, El Puente, el CRM y los planes de Konnect™.",
  groups: [
    {
      title: "General",
      items: [
        {
          q: "¿Qué es Konnect?",
          a: "Konnect es un directorio de negocios (estilo Páginas Amarillas moderno) unido a un CRM privado. El diferencial es El Puente: cada interacción en el perfil público se registra como lead en el CRM del negocio.",
        },
        {
          q: "¿Para quién es?",
          a: "Negocios del metro de Atlanta que atienden en español e inglés — remodelación, food, salud, legal, seguros y más — y quieren capturar leads sin perder llamadas o WhatsApps.",
        },
        {
          q: "¿Está en español e inglés?",
          a: "Sí. La interfaz es español primero y puedes cambiar a inglés con el switcher ES/EN del header.",
        },
      ],
    },
    {
      title: "Directorio y perfil público",
      items: [
        {
          q: "¿Cómo aparece mi negocio?",
          a: "Te registras, completas el wizard y tu perfil queda PENDING hasta que un admin lo apruebe. Al aprobarse se publica en el directorio y puedes recibir leads.",
        },
        {
          q: "¿Qué es El Puente?",
          a: "Es la conexión automática entre el perfil público y tu CRM: formularios, cotizaciones, click-to-call y WhatsApp generan leads con source tracking.",
        },
        {
          q: "¿Quién ve las reseñas?",
          a: "Solo las reseñas aprobadas por moderación aparecen en el perfil público.",
        },
      ],
    },
    {
      title: "CRM y leads",
      items: [
        {
          q: "¿Los leads del plan Free se pierden?",
          a: "No. Se guardan todos. En Free solo desbloqueas la visualización de los primeros 20 del mes hasta que actualices a Pro o Premium.",
        },
        {
          q: "¿Puedo importar contactos?",
          a: "Sí, importación CSV está disponible desde el plan Pro.",
        },
        {
          q: "¿Recibo emails de nuevos leads?",
          a: "Sí, si configuramos Resend y tu negocio tiene email. También hay un resumen semanal por cron (lunes).",
        },
      ],
    },
    {
      title: "Planes y facturación",
      items: [
        {
          q: "¿Cuáles son los planes?",
          a: "Free ($0), Pro ($19/mes) y Premium ($49/mes). Detalle en /precios. Destacado en directorio y analytics avanzados son Premium.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí. Gestionas la suscripción en el portal de Stripe desde /app/plan. La cancelación evita renovaciones futuras.",
        },
        {
          q: "¿Hay reembolsos?",
          a: "Salvo que la ley exija lo contrario, los períodos ya iniciados no son reembolsables. Ver Términos.",
        },
      ],
    },
    {
      title: "Privacidad y legal",
      items: [
        {
          q: "¿Dónde están los documentos legales?",
          a: "Términos en /terminos y Privacidad en /privacidad. Contacto: legal@kmd.agency.",
        },
        {
          q: "¿Quién es dueño de los leads?",
          a: "El negocio receptor trata los leads como su relación comercial. Konnect aloja y facilita la captura según la Política de privacidad.",
        },
      ],
    },
    {
      title: "Integraciones",
      items: [
        {
          q: "¿Cómo conecto QuickBooks o Square?",
          a: "Hoy: en /app/integraciones activa el webhook lead.created y conéctalo a Zapier/Make → Square o QuickBooks Online. OAuth nativo es roadmap. Detalle en /developers.",
        },
        {
          q: "¿Stripe es para cobrar a mis clientes?",
          a: "No. Stripe en Konnect cobra tu plan Free/Pro/Premium. No es Stripe Connect para cobros a clientes finales del directorio.",
        },
        {
          q: "¿Hay API para desarrolladores?",
          a: "Webhooks de salida ya están. API REST en early access. Consulta /developers o escribe a developers@kmd.agency.",
        },
      ],
    },
  ],
};

export const faqEn: typeof faqEs = {
  title: "Frequently asked questions",
  subtitle:
    "Clear answers about the directory, El Puente, the CRM, and Konnect™ plans.",
  groups: [
    {
      title: "General",
      items: [
        {
          q: "What is Konnect?",
          a: "Konnect is a modern business directory plus a private CRM. The differentiator is El Puente: every public-profile interaction is logged as a CRM lead.",
        },
        {
          q: "Who is it for?",
          a: "Atlanta-metro businesses serving Spanish and English speakers who want to capture leads without losing calls or WhatsApps.",
        },
        {
          q: "Is it bilingual?",
          a: "Yes. Spanish-first UI with an ES/EN switcher in the header.",
        },
      ],
    },
    {
      title: "Directory & public profile",
      items: [
        {
          q: "How does my business go live?",
          a: "Sign up, complete onboarding, and wait for admin approval. Once ACTIVE, you appear in the directory and can receive leads.",
        },
        {
          q: "What is El Puente?",
          a: "Automatic bridge from public profile to CRM: forms, quotes, click-to-call, and WhatsApp create leads with source tracking.",
        },
        {
          q: "Who sees reviews?",
          a: "Only moderation-approved reviews appear on the public profile.",
        },
      ],
    },
    {
      title: "CRM & leads",
      items: [
        {
          q: "Do Free-plan leads get lost?",
          a: "No. Every lead is saved. Free only unlocks viewing the first 20 each month until you upgrade.",
        },
        {
          q: "Can I import contacts?",
          a: "Yes — CSV import is available on Pro and above.",
        },
        {
          q: "Will I get new-lead emails?",
          a: "Yes when Resend is configured and your business has an email. There is also a weekly Monday digest.",
        },
      ],
    },
    {
      title: "Plans & billing",
      items: [
        {
          q: "What are the plans?",
          a: "Free ($0), Pro ($19/mo), Premium ($49/mo). See /precios. Featured listing and advanced analytics are Premium.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. Manage subscription in the Stripe portal from /app/plan. Canceling stops future renewals.",
        },
        {
          q: "Are there refunds?",
          a: "Unless required by law, started billing periods are non-refundable. See Terms.",
        },
      ],
    },
    {
      title: "Privacy & legal",
      items: [
        {
          q: "Where are the legal docs?",
          a: "Terms at /terminos and Privacy at /privacidad. Contact: legal@kmd.agency.",
        },
        {
          q: "Who owns the leads?",
          a: "The receiving business owns the commercial relationship. Konnect hosts and enables capture under the Privacy Policy.",
        },
      ],
    },
    {
      title: "Integrations",
      items: [
        {
          q: "How do I connect QuickBooks or Square?",
          a: "Today: in /app/integraciones enable the lead.created webhook and pipe it through Zapier/Make → Square or QuickBooks Online. Native OAuth is on the roadmap. Details at /developers.",
        },
        {
          q: "Is Stripe for charging my customers?",
          a: "No. Stripe on Konnect bills your Free/Pro/Premium plan. It is not Stripe Connect for charging directory end-customers.",
        },
        {
          q: "Is there a developer API?",
          a: "Outbound webhooks are live. REST API is early access. See /developers or email developers@kmd.agency.",
        },
      ],
    },
  ],
};
