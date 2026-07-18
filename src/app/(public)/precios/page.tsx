import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_CATALOG } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes Free, Pro y Premium de Konnect para negocios hispanos en Atlanta: directorio + CRM con captura de leads.",
  alternates: { canonical: "/precios" },
};

export default async function PreciosPage() {
  const t = await getTranslations("pricing");

  const cta: Record<string, string> = {
    FREE: t("ctaFree"),
    PRO: t("ctaPro"),
    PREMIUM: t("ctaPremium"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLAN_CATALOG.map((plan) => {
          const highlight = plan.id === "PRO";
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col shadow-sm",
                highlight && "border-primary ring-1 ring-primary",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {highlight && <Badge>Popular</Badge>}
                </div>
                <CardDescription className="text-3xl font-bold text-foreground">
                  {plan.priceLabel}
                  {plan.priceCents > 0 && (
                    <span className="text-base font-normal text-muted-foreground">
                      {t("perMonth")}
                    </span>
                  )}
                </CardDescription>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={highlight ? "default" : "outline"}>
                  <Link
                    href={
                      plan.id === "FREE"
                        ? "/registrar-empresa"
                        : `/signup?callbackUrl=${encodeURIComponent("/app/plan")}`
                    }
                  >
                    {cta[plan.id]}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="mx-auto mt-16 max-w-2xl space-y-6">
        <h2 className="text-center text-xl font-semibold">{t("faqTitle")}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{t("faq1q")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("faq1a")}</p>
          </div>
          <div>
            <h3 className="font-medium">{t("faq2q")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("faq2a")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
