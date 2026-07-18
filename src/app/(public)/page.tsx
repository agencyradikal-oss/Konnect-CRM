import Link from "next/link";
import { Search, BadgeCheck, ArrowRight } from "lucide-react";
import type { Business, Category } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type FeaturedBusiness = Business & { category: Category };

export default async function HomePage() {
  const t = await getTranslations("home");
  let categories: Category[] = [];
  let featured: FeaturedBusiness[] = [];
  let dbError = false;

  try {
    [categories, featured] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { nameEs: "asc" },
      }),
      prisma.business.findMany({
        where: { status: "ACTIVE", featured: true },
        include: { category: true },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  } catch (error) {
    dbError = true;
    console.error("[home] Database unavailable:", error);
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/70 via-accent/30 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("subtitle")}
          </p>

          <form
            action="/directorio"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder={t("searchPlaceholder")}
                className="h-12 pl-9"
                autoComplete="off"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              {t("search")}
            </Button>
          </form>
        </div>
      </section>

      {dbError && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t("dbError")}
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold">{t("categories")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`} prefetch={false}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="p-4">
                  <p className="font-medium">{cat.nameEs}</p>
                  <p className="text-xs text-muted-foreground">{cat.nameEn}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("featured")}</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/directorio">
                {t("viewAll")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((biz) => (
              <Link key={biz.id} href={`/negocio/${biz.slug}`} prefetch={false}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{biz.name}</h3>
                      {biz.verified && (
                        <BadgeCheck className="size-5 shrink-0 text-primary" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {biz.category.nameEs}
                    </Badge>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {biz.description}
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">
                      {biz.city}, GA
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
          <h2 className="text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="max-w-lg text-sidebar-foreground/80">{t("ctaBody")}</p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/registrar-empresa">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
