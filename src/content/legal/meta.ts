export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDoc = {
  title: string;
  effectiveDate: string;
  effectiveLabel: string;
  intro: string;
  sections: LegalSection[];
  contactEmail: string;
  entity: string;
  counselNote: string;
  contactLabel: string;
};

export const LEGAL_ENTITY = "KMD Agency LLC";
export const LEGAL_CONTACT = "legal@kmd.agency";
export const SUPPORT_CONTACT = "soporte@kmd.agency";
export const DEVELOPERS_CONTACT = "developers@kmd.agency";
export const SITE_URL = "https://konnect.kmd.agency";
export const EFFECTIVE_DATE_ES = "18 de julio de 2026";
export const EFFECTIVE_DATE_EN = "July 18, 2026";
