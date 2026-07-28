import type { FollowUpTemplateSet } from "@/lib/plans";

export type MarketingTemplate = {
  key: string;
  label: string;
  subject: string;
  body: string;
  /** basic ⊂ standard ⊂ full */
  minSet: FollowUpTemplateSet;
};

const SET_RANK: Record<FollowUpTemplateSet, number> = {
  basic: 0,
  standard: 1,
  full: 2,
};

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    key: "thanks",
    label: "Gracias por contactarnos",
    subject: "Gracias por escribirnos — {{negocio}}",
    body: "Hola {{nombre}},\n\nGracias por contactar a {{negocio}}. Recibimos tu mensaje y queremos ayudarte.\n\n¿Cuál es el mejor horario para hablar?\n\nSaludos,\n{{negocio}}",
    minSet: "basic",
  },
  {
    key: "still_interested",
    label: "¿Sigues interesado?",
    subject: "¿Sigues interesado? — {{negocio}}",
    body: "Hola {{nombre}},\n\nTe escribimos de {{negocio}} para saber si aún te interesa nuestro servicio.\n\nSi quieres, agendamos una llamada rápida o una visita.\n\nQuedamos atentos,\n{{negocio}}",
    minSet: "basic",
  },
  {
    key: "ask_review",
    label: "Pide una reseña",
    subject: "¿Nos dejas una reseña? — {{negocio}}",
    body: "Hola {{nombre}},\n\nFue un gusto atenderte. Si tu experiencia con {{negocio}} fue buena, una reseña corta nos ayuda mucho en el directorio.\n\n¡Gracias!\n{{negocio}}",
    minSet: "basic",
  },
  {
    key: "appt_reminder",
    label: "Recordatorio de cita",
    subject: "Recordatorio de tu cita — {{negocio}}",
    body: "Hola {{nombre}},\n\nTe recordamos tu cita con {{negocio}}. Si necesitas cambiar la hora, respóndenos y la reprogramamos.\n\nNos vemos pronto,\n{{negocio}}",
    minSet: "standard",
  },
  {
    key: "estimate_pending",
    label: "Presupuesto pendiente",
    subject: "Tu presupuesto está listo — {{negocio}}",
    body: "Hola {{nombre}},\n\nPreparamos tu presupuesto en {{negocio}}. ¿Tienes alguna pregunta o quieres avanzar?\n\nEstamos para ayudarte,\n{{negocio}}",
    minSet: "standard",
  },
  {
    key: "in_your_area",
    label: "Estamos en tu zona",
    subject: "Estamos cerca de ti — {{negocio}}",
    body: "Hola {{nombre}},\n\nSomos {{negocio}} y trabajamos en tu zona del metro de Atlanta. Si necesitas medida, visita o cotización, escríbenos.\n\nSaludos,\n{{negocio}}",
    minSet: "standard",
  },
  {
    key: "whatsapp_prefer",
    label: "Preferimos WhatsApp",
    subject: "Escríbenos por WhatsApp — {{negocio}}",
    body: "Hola {{nombre}},\n\nEn {{negocio}} respondemos más rápido por WhatsApp. Si te queda cómodo, mándanos un mensaje y te atendemos.\n\nGracias,\n{{negocio}}",
    minSet: "full",
  },
  {
    key: "featured_profile",
    label: "Mira nuestro perfil Destacado",
    subject: "Encuéntranos en Konnect — {{negocio}}",
    body: "Hola {{nombre}},\n\nPuedes ver el perfil de {{negocio}} en Konnect (directorio local). Ahí tienes fotos, contacto y cómo pedirnos cotización.\n\nSaludos,\n{{negocio}}",
    minSet: "full",
  },
];

export function templatesForSet(set: FollowUpTemplateSet): MarketingTemplate[] {
  const rank = SET_RANK[set];
  return MARKETING_TEMPLATES.filter((t) => SET_RANK[t.minSet] <= rank);
}

export function getTemplate(key: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES.find((t) => t.key === key);
}

export function renderTemplate(
  template: MarketingTemplate,
  vars: { nombre: string; negocio: string },
): { subject: string; body: string } {
  const replace = (s: string) =>
    s
      .replaceAll("{{nombre}}", vars.nombre.trim() || "cliente")
      .replaceAll("{{negocio}}", vars.negocio.trim() || "nuestro negocio");
  return { subject: replace(template.subject), body: replace(template.body) };
}
