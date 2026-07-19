import {
  EFFECTIVE_DATE_EN,
  EFFECTIVE_DATE_ES,
  LEGAL_CONTACT,
  LEGAL_ENTITY,
  SITE_URL,
  type LegalDoc,
} from "./meta";

export const privacidadEs: LegalDoc = {
  title: "Política de privacidad",
  effectiveDate: EFFECTIVE_DATE_ES,
  effectiveLabel: "Vigente desde",
  counselNote:
    "Documento informativo de producto. Para asesoría legal específica, consulta a un abogado.",
  contactLabel: "Contacto",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "Esta Política explica cómo KMD Agency LLC (“nosotros”) recopila, usa y comparte información personal en Konnect™ (konnect.kmd.agency). Aplica a visitantes del directorio, dueños de negocio y usuarios del CRM.",
  sections: [
    {
      id: "responsable",
      title: "1. Responsable",
      paragraphs: [
        `${LEGAL_ENTITY}, operando Konnect™ desde el área metro de Atlanta, Georgia, EE. UU. Contacto de privacidad: ${LEGAL_CONTACT}.`,
      ],
    },
    {
      id: "datos",
      title: "2. Datos que recopilamos",
      paragraphs: ["Dependiendo de cómo uses el Servicio, podemos tratar:"],
      bullets: [
        "Cuenta: nombre, email, contraseña hasheada, rol y negocio asociado.",
        "Perfil de negocio: datos públicos del listado (nombre, teléfono, WhatsApp, dirección, fotos, horarios, descripción).",
        "Leads y mensajes: datos enviados por visitantes en formularios o cotizaciones (nombre, email, teléfono, mensaje) y metadatos de origen (formulario, llamada, WhatsApp).",
        "Uso y técnica: direcciones IP aproximadas, logs, cookies de sesión/idioma, páginas vistas de perfiles (analytics del plan Premium).",
        "Pagos: identificadores de cliente/suscripción de Stripe (no almacenamos números completos de tarjeta).",
      ],
    },
    {
      id: "bases",
      title: "3. Para qué usamos los datos",
      paragraphs: [
        "Operar el directorio y el CRM; autenticar usuarios; enviar emails transaccionales (bienvenida, aprobación, nuevo lead, resumen semanal); facturar planes; prevenir abuso y mejorar el producto; cumplir obligaciones legales.",
      ],
    },
    {
      id: "compartir",
      title: "4. Con quién compartimos",
      paragraphs: [
        "No vendemos datos personales. Compartimos con proveedores que nos ayudan a operar el Servicio, bajo contratos adecuados:",
      ],
      bullets: [
        "Hosting e infraestructura (p. ej. Vercel), base de datos (Neon/PostgreSQL), archivos (Vercel Blob).",
        "Auth y email (Clerk OAuth / email-password, Resend).",
        "Pagos (Stripe).",
        "Cuando un visitante contacta un negocio, ese negocio recibe el lead y actúa como responsable independiente de ese tratamiento comercial.",
      ],
    },
    {
      id: "retencion",
      title: "5. Conservación",
      paragraphs: [
        `Conservamos datos mientras la cuenta esté activa o sea necesario para el Servicio, disputas, seguridad y requisitos legales. Puedes solicitar eliminación de cuenta escribiendo a ${LEGAL_CONTACT}; algunos registros pueden retenerse de forma limitada por obligación legal o backup.`,
      ],
    },
    {
      id: "derechos",
      title: "6. Tus derechos",
      paragraphs: [
        `Según tu jurisdicción (p. ej. residentes de ciertos estados de EE. UU.), puedes solicitar acceso, corrección, eliminación o exportar ciertos datos. Contáctanos en ${LEGAL_CONTACT}. Verificaremos la solicitud de forma razonable.`,
        "Los visitantes que dejaron un lead en un negocio deben contactar también a ese negocio para solicitudes sobre el tratamiento que el negocio realiza.",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies y preferencias",
      paragraphs: [
        "Usamos cookies o almacenamiento local esenciales para sesión de autenticación e idioma (NEXT_LOCALE). No usamos redes publicitarias de terceros en el núcleo del producto.",
      ],
    },
    {
      id: "seguridad",
      title: "8. Seguridad",
      paragraphs: [
        `Aplicamos medidas técnicas y organizativas razonables (HTTPS, hashing de contraseñas, control de acceso por roles, validación de entradas). Ningún sistema es 100% seguro; notifica incidentes sospechosos a ${LEGAL_CONTACT}.`,
      ],
    },
    {
      id: "menores",
      title: "9. Menores",
      paragraphs: [
        "El Servicio no está dirigido a menores de 16 años. No recopilamos a sabiendas datos de menores.",
      ],
    },
    {
      id: "cambios",
      title: "10. Cambios",
      paragraphs: [
        `Podemos actualizar esta Política. La fecha de vigencia aparece arriba. Versión publicada en ${SITE_URL}/privacidad.`,
      ],
    },
  ],
};

export const privacidadEn: LegalDoc = {
  title: "Privacy Policy",
  effectiveDate: EFFECTIVE_DATE_EN,
  effectiveLabel: "Effective",
  counselNote:
    "Product information document. For specific legal advice, consult an attorney.",
  contactLabel: "Contact",
  entity: LEGAL_ENTITY,
  contactEmail: LEGAL_CONTACT,
  intro:
    "This Policy explains how KMD Agency LLC (“we”) collects, uses, and shares personal information on Konnect™ (konnect.kmd.agency). It applies to directory visitors, business owners, and CRM users.",
  sections: [
    {
      id: "responsable",
      title: "1. Controller",
      paragraphs: [
        `${LEGAL_ENTITY}, operating Konnect™ from Atlanta metro, Georgia, USA. Privacy contact: ${LEGAL_CONTACT}.`,
      ],
    },
    {
      id: "datos",
      title: "2. Data we collect",
      paragraphs: ["Depending on how you use the Service, we may process:"],
      bullets: [
        "Account: name, email, hashed password, role, and linked business.",
        "Business profile: public listing data (name, phone, WhatsApp, address, photos, hours, description).",
        "Leads and messages: visitor form/quote data (name, email, phone, message) and source metadata.",
        "Usage/technical: approximate IP, logs, session/locale cookies, profile page views (Premium analytics).",
        "Payments: Stripe customer/subscription IDs (we do not store full card numbers).",
      ],
    },
    {
      id: "bases",
      title: "3. How we use data",
      paragraphs: [
        "To operate the directory and CRM; authenticate users; send transactional email (welcome, approval, new lead, weekly digest); bill plans; prevent abuse; improve the product; and meet legal duties.",
      ],
    },
    {
      id: "compartir",
      title: "4. Sharing",
      paragraphs: [
        "We do not sell personal data. We share with processors that help run the Service under appropriate agreements:",
      ],
      bullets: [
        "Hosting (e.g. Vercel), database (Neon/PostgreSQL), files (Vercel Blob).",
        "Auth and email (Clerk OAuth / email-password, Resend).",
        "Payments (Stripe).",
        "When a visitor contacts a business, that business receives the lead and is an independent controller for that commercial relationship.",
      ],
    },
    {
      id: "retencion",
      title: "5. Retention",
      paragraphs: [
        `We keep data while the account is active or as needed for the Service, disputes, security, and legal requirements. You may request account deletion at ${LEGAL_CONTACT}; limited records may remain for legal or backup purposes.`,
      ],
    },
    {
      id: "derechos",
      title: "6. Your rights",
      paragraphs: [
        `Depending on your jurisdiction, you may request access, correction, deletion, or export of certain data. Contact ${LEGAL_CONTACT}. We will verify requests reasonably.`,
        "Visitors who submitted a lead should also contact that business for requests about the business’s own processing.",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies",
      paragraphs: [
        "We use essential cookies/storage for auth session and locale (NEXT_LOCALE). We do not run third-party ad networks in the core product.",
      ],
    },
    {
      id: "seguridad",
      title: "8. Security",
      paragraphs: [
        `We apply reasonable technical and organizational measures (HTTPS, password hashing, role-based access, input validation). No system is 100% secure; report suspected incidents to ${LEGAL_CONTACT}.`,
      ],
    },
    {
      id: "menores",
      title: "9. Children",
      paragraphs: [
        "The Service is not directed to children under 16. We do not knowingly collect children’s data.",
      ],
    },
    {
      id: "cambios",
      title: "10. Changes",
      paragraphs: [
        `We may update this Policy. The effective date is shown above. Published at ${SITE_URL}/privacidad.`,
      ],
    },
  ],
};
