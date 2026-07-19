export type HowStep = {
  step: string;
  title: string;
  body: string;
};

export type HowPillar = {
  title: string;
  body: string;
};

export const howItWorksEs = {
  title: "Cómo funciona",
  subtitle:
    "Directorio público + CRM privado, unidos por El Puente: ninguna llamada, WhatsApp o formulario se pierde.",
  ctaPrimary: "Registra tu negocio gratis",
  ctaSecondary: "Ver precios",
  pillarsTitle: "Tres pilares",
  pillars: [
    {
      title: "1. Directorio público",
      body: "Tu negocio aparece en Konnect como un perfil moderno: categoría, ciudad, fotos, horarios y reseñas. Los clientes te encuentran en español o inglés.",
    },
    {
      title: "2. CRM multi-tenant",
      body: "Cada negocio tiene su panel privado: leads, contactos, deals (pipeline), tareas y actividades. Pensado para usarlo desde el teléfono.",
    },
    {
      title: "3. El Puente",
      body: "Lo que diferencia a Konnect: toda interacción en el perfil público se registra automáticamente como Lead en tu CRM, con origen (formulario, cotización, llamada o WhatsApp).",
    },
  ] satisfies HowPillar[],
  stepsTitle: "En 4 pasos",
  steps: [
    {
      step: "01",
      title: "Crea tu cuenta",
      body: "Regístrate gratis como dueño de negocio. En minutos entras al wizard de onboarding.",
    },
    {
      step: "02",
      title: "Publica tu perfil",
      body: "Completa datos, logo y horario. Un admin revisa y aprueba; al activarse, apareces en el directorio.",
    },
    {
      step: "03",
      title: "Recibe leads solos",
      body: "Cuando alguien te escribe, pide cotización, llama o abre WhatsApp desde tu perfil, El Puente crea el lead en tu inbox.",
    },
    {
      step: "04",
      title: "Cierra en el CRM",
      body: "Califica el lead, conviértelo en contacto/deal, asigna tareas y sigue el pipeline. Escala a Pro o Premium cuando crezcas.",
    },
  ] satisfies HowStep[],
  puenteTitle: "Qué captura El Puente",
  puenteItems: [
    { label: "Formulario de contacto", source: "DIRECTORY_FORM" },
    { label: "Pedido de cotización", source: "QUOTE_REQUEST" },
    { label: "Click-to-call", source: "CLICK_CALL" },
    { label: "WhatsApp", source: "CLICK_WHATSAPP" },
  ],
  puenteNote:
    "También puedes crear leads manuales o importar contactos (CSV en Pro+). Los emails de nuevo lead y el resumen semanal te mantienen al día.",
  plansTitle: "Planes que crecen contigo",
  plansBody:
    "Empieza en Free. Pro desbloquea CRM ilimitado e import CSV. Premium añade destacado en el directorio y analytics de visitas al perfil.",
  integrationsNote:
    "¿Usas Square o QuickBooks? En /app/integraciones conectas un webhook lead.created hacia Zapier/Make. Stripe en Konnect es solo para tu plan de suscripción.",
};

export const howItWorksEn = {
  title: "How it works",
  subtitle:
    "Public directory + private CRM, connected by El Puente — no call, WhatsApp, or form gets lost.",
  ctaPrimary: "List your business free",
  ctaSecondary: "See pricing",
  pillarsTitle: "Three pillars",
  pillars: [
    {
      title: "1. Public directory",
      body: "Your business gets a modern profile: category, city, photos, hours, and reviews. Customers find you in Spanish or English.",
    },
    {
      title: "2. Multi-tenant CRM",
      body: "Each business has a private dashboard: leads, contacts, deals (pipeline), tasks, and activities — built mobile-first.",
    },
    {
      title: "3. El Puente",
      body: "Konnect’s differentiator: every public-profile interaction is logged as a Lead in your CRM, with source tracking (form, quote, call, or WhatsApp).",
    },
  ] satisfies HowPillar[],
  stepsTitle: "In 4 steps",
  steps: [
    {
      step: "01",
      title: "Create your account",
      body: "Sign up free as a business owner. You’re in the onboarding wizard in minutes.",
    },
    {
      step: "02",
      title: "Publish your profile",
      body: "Add details, logo, and hours. An admin reviews and approves; once ACTIVE, you appear in the directory.",
    },
    {
      step: "03",
      title: "Leads arrive automatically",
      body: "When someone messages you, requests a quote, calls, or opens WhatsApp from your profile, El Puente creates the lead in your inbox.",
    },
    {
      step: "04",
      title: "Close in the CRM",
      body: "Qualify the lead, convert to contact/deal, assign tasks, and run your pipeline. Upgrade to Pro or Premium as you grow.",
    },
  ] satisfies HowStep[],
  puenteTitle: "What El Puente captures",
  puenteItems: [
    { label: "Contact form", source: "DIRECTORY_FORM" },
    { label: "Quote request", source: "QUOTE_REQUEST" },
    { label: "Click-to-call", source: "CLICK_CALL" },
    { label: "WhatsApp", source: "CLICK_WHATSAPP" },
  ],
  puenteNote:
    "You can also create manual leads or import contacts (CSV on Pro+). New-lead emails and the weekly digest keep you in the loop.",
  plansTitle: "Plans that scale with you",
  plansBody:
    "Start on Free. Pro unlocks unlimited CRM and CSV import. Premium adds featured directory placement and profile-view analytics.",
  integrationsNote:
    "Using Square or QuickBooks? In /app/integraciones connect a lead.created webhook to Zapier/Make. Stripe on Konnect is only for your subscription plan.",
};
