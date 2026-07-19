import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, Phone, FileText, Quote } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { howItWorksEn, howItWorksEs } from "@/content/how-it-works";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Cómo Konnect une directorio público, CRM y El Puente para capturar leads automáticamente en Atlanta.",
  alternates: { canonical: "/como-funciona" },
};

const puenteIcons = [FileText, Quote, Phone, MessageSquare] as const;

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const t = locale === "en" ? howItWorksEn : howItWorksEs;

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/70 via-accent/30 to-background">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/registrar-empresa">
                {t.ctaPrimary} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/precios">{t.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">{t.pillarsTitle}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {t.pillars.map((p) => (
            <div key={p.title}>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">{t.stepsTitle}</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.steps.map((s) => (
              <li key={s.step}>
                <span className="text-sm font-bold text-primary">{s.step}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">{t.puenteTitle}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {t.puenteItems.map((item, i) => {
            const Icon = puenteIcons[i] ?? FileText;
            return (
              <li
                key={item.source}
                className="flex items-start gap-3 rounded-lg border bg-background p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <Badge variant="secondary" className="mt-1 font-mono text-xs">
                    {item.source}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          {t.puenteNote}
        </p>
      </section>

      <section className="border-t bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold">{t.plansTitle}</h2>
            <p className="mt-2 text-sidebar-foreground/80">{t.plansBody}</p>
            <p className="mt-3 text-sm text-sidebar-foreground/70">
              {t.integrationsNote}{" "}
              <Link href="/developers" className="underline">
                Developers
              </Link>
              {" · "}
              <Link href="/app/integraciones" className="underline">
                /app/integraciones
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/precios">{t.ctaSecondary}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-sidebar-border bg-transparent"
            >
              <Link href="/faq">FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
