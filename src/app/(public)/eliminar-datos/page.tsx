import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import {
  eliminarDatosEn,
  eliminarDatosEs,
} from "@/content/legal/eliminar-datos";

export const metadata: Metadata = {
  title: "Eliminación de datos",
  description:
    "Cómo solicitar la eliminación de tu cuenta y datos personales en Konnect™.",
  alternates: { canonical: "/eliminar-datos" },
  robots: { index: true, follow: true },
};

export default async function EliminarDatosPage() {
  const locale = await getLocale();
  const doc = locale === "en" ? eliminarDatosEn : eliminarDatosEs;
  return <LegalDocument doc={doc} />;
}
