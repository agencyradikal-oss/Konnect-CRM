import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { terminosEn, terminosEs } from "@/content/legal/terminos";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos de uso de Konnect™ — directorio y CRM operado por KMD Agency LLC.",
  alternates: { canonical: "/terminos" },
};

export default async function TerminosPage() {
  const locale = await getLocale();
  const doc = locale === "en" ? terminosEn : terminosEs;
  return <LegalDocument doc={doc} />;
}
