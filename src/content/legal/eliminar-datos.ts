import {
  EFFECTIVE_DATE_EN,
  EFFECTIVE_DATE_ES,
  LEGAL_CONTACT,
  LEGAL_ENTITY,
  SITE_URL,
  type LegalDoc,
} from "./meta";

export const eliminarDatosEs: LegalDoc = {
  title: "Eliminación de datos y cuenta",
  effectiveDate: EFFECTIVE_DATE_ES,
  effectiveLabel: "Vigente desde",
  counselNote:
    "Instrucciones para solicitar la eliminación de datos personales en Konnect™ (requisito de proveedores OAuth como Google).",
  contactLabel: "Contacto",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "Si usas Konnect™ con Google u otro inicio de sesión, o tienes una cuenta de negocio, puedes solicitar que eliminemos tus datos personales y tu cuenta. Esta página explica cómo hacerlo.",
  sections: [
    {
      id: "que-se-elimina",
      title: "1. Qué datos se eliminan",
      paragraphs: [
        "Tras verificar tu identidad, eliminamos o anonimizamos de forma razonable:",
      ],
      bullets: [
        "Tu cuenta de usuario (email, nombre, rol) en Konnect y la identidad asociada en el proveedor de autenticación (Clerk).",
        "Si eres dueño o staff: el vínculo con tu negocio; puedes pedir también la baja del listado público y datos del CRM de ese tenant (leads, contactos, deals, tareas) cuando seas el responsable de esa cuenta de negocio.",
        "Preferencias de sesión e identificadores técnicos asociados a tu cuenta.",
      ],
    },
    {
      id: "como-solicitar",
      title: "2. Cómo solicitar la eliminación",
      paragraphs: [
        "Envía un email a la dirección de contacto de abajo desde el mismo correo con el que inicias sesión en Konnect.",
      ],
      bullets: [
        `Destinatario: ${LEGAL_CONTACT}`,
        'Asunto: "Eliminar cuenta Konnect"',
        "Incluye: nombre completo, email de la cuenta y, si aplica, el nombre o slug del negocio.",
        "Opcional: indica si también quieres borrar el perfil público del negocio y los datos del CRM.",
      ],
    },
    {
      id: "plazo",
      title: "3. Plazo de respuesta",
      paragraphs: [
        "Responderemos en un plazo razonable, normalmente dentro de 30 días. Algunos registros pueden retenerse de forma limitada por obligación legal, seguridad, disputas de facturación (Stripe) o copias de seguridad temporales.",
      ],
    },
    {
      id: "leads-visitantes",
      title: "4. Visitantes que dejaron un lead",
      paragraphs: [
        "Si solo enviaste un formulario o cotización a un negocio del directorio (sin cuenta Konnect), ese negocio actúa como responsable independiente de esos datos. Contáctalos directamente y, si lo deseas, también a nosotros en el email de contacto para coordinar lo que esté bajo nuestro control.",
      ],
    },
    {
      id: "mas-info",
      title: "5. Más información",
      paragraphs: [
        `Consulta la Política de privacidad en ${SITE_URL}/privacidad y los Términos en ${SITE_URL}/terminos.`,
      ],
    },
  ],
};

export const eliminarDatosEn: LegalDoc = {
  title: "Data and account deletion",
  effectiveDate: EFFECTIVE_DATE_EN,
  effectiveLabel: "Effective",
  counselNote:
    "Instructions to request deletion of personal data on Konnect™ (required by OAuth providers such as Google).",
  contactLabel: "Contact",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "If you use Konnect™ with Google or another sign-in method, or you have a business account, you can request that we delete your personal data and account. This page explains how.",
  sections: [
    {
      id: "que-se-elimina",
      title: "1. What data is deleted",
      paragraphs: [
        "After verifying your identity, we delete or reasonably anonymize:",
      ],
      bullets: [
        "Your user account (email, name, role) in Konnect and the linked identity at the authentication provider (Clerk).",
        "If you are an owner or staff: the link to your business; you may also request removal of the public listing and that tenant’s CRM data (leads, contacts, deals, tasks) when you control that business account.",
        "Session preferences and technical identifiers associated with your account.",
      ],
    },
    {
      id: "como-solicitar",
      title: "2. How to request deletion",
      paragraphs: [
        "Email the contact address below from the same email you use to sign in to Konnect.",
      ],
      bullets: [
        `To: ${LEGAL_CONTACT}`,
        'Subject: "Delete Konnect account"',
        "Include: full name, account email, and if applicable the business name or slug.",
        "Optional: say whether you also want the public business profile and CRM data deleted.",
      ],
    },
    {
      id: "plazo",
      title: "3. Response time",
      paragraphs: [
        "We will respond within a reasonable time, typically within 30 days. Some records may be retained for a limited period for legal obligations, security, billing disputes (Stripe), or temporary backups.",
      ],
    },
    {
      id: "leads-visitantes",
      title: "4. Visitors who left a lead",
      paragraphs: [
        "If you only submitted a form or quote request to a directory business (no Konnect account), that business is an independent controller of that data. Contact them directly and, if you wish, also email us so we can coordinate what is under our control.",
      ],
    },
    {
      id: "mas-info",
      title: "5. More information",
      paragraphs: [
        `See the Privacy Policy at ${SITE_URL}/privacidad and the Terms at ${SITE_URL}/terminos.`,
      ],
    },
  ],
};
