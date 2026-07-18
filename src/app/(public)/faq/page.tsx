import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { faqEn, faqEs } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Preguntas frecuentes sobre Konnect™: directorio, El Puente, CRM, planes e integraciones.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const locale = await getLocale();
  const faq = locale === "en" ? faqEn : faqEs;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {faq.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {faq.subtitle}
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {faq.groups.map((group) => (
          <section key={group.title}>
            <h2 className="text-lg font-semibold text-primary">{group.title}</h2>
            <dl className="mt-4 space-y-6">
              {group.items.map((item) => (
                <div key={item.q} className="border-b pb-6 last:border-0">
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        {locale === "en" ? "Still need help?" : "¿Aún necesitas ayuda?"}{" "}
        <Link href="/precios" className="text-primary underline">
          /precios
        </Link>
        {" · "}
        <Link href="/terminos" className="text-primary underline">
          {locale === "en" ? "Terms" : "Términos"}
        </Link>
        {" · "}
        <Link href="/developers" className="text-primary underline">
          Developers
        </Link>
        {" · "}
        <a href="mailto:soporte@kmd.agency" className="text-primary underline">
          soporte@kmd.agency
        </a>
      </p>
    </div>
  );
}
