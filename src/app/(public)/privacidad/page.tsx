import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { privacidadEn, privacidadEs } from "@/content/legal/privacidad";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo Konnect™ y KMD Agency LLC tratan datos personales de visitantes y negocios.",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacidadPage() {
  const locale = await getLocale();
  const doc = locale === "en" ? privacidadEn : privacidadEs;
  return <LegalDocument doc={doc} />;
}
