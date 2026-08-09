import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { BusinessCard } from "@/components/directory/business-card";
import {
  DirectoryNav,
  breadcrumbJsonLd,
} from "@/components/directory/directory-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryLabel } from "@/lib/category-label";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return {};
    const label = categoryLabel(category, locale);
    return {
      title: locale === "en" ? `${label} in Atlanta` : `${label} en Atlanta`,
      description:
        locale === "en"
          ? `${label} businesses serving Atlanta metro.`
          : `Negocios de ${label.toLowerCase()} con atención en español en Atlanta metro.`,
      alternates: { canonical: `/categoria/${category.slug}` },
    };
  } catch {
    return {};
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("directory");
  const tc = await getTranslations("category");
  const th = await getTranslations("home");
  const locale = await getLocale();

  let category;
  try {
    category = await prisma.category.findUnique({
      where: { slug },
      include: {
        businesses: {
          where: { status: "ACTIVE" },
          include: { category: true },
          orderBy: [{ featured: "desc" }, { verified: "desc" }],
        },
      },
    });
  } catch (error) {
    console.error("[categoria] Database unavailable:", error);
    notFound();
  }
  if (!category) notFound();

  const label = categoryLabel(category, locale);
  const count = category.businesses.length;

  const crumbsLd = breadcrumbJsonLd(getAppBaseUrl(), [
    { name: t("home"), path: "/" },
    { name: t("title"), path: "/directorio" },
    { name: label, path: `/categoria/${category.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }}
      />

      <DirectoryNav
        backHref="/directorio"
        items={[
          { label: t("home"), href: "/" },
          { label: t("title"), href: "/directorio" },
          { label },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{label}</h1>
      <p className="mt-1 text-muted-foreground">
        {tc(count === 1 ? "count" : "count_plural", { count })}
      </p>

      <form
        action="/directorio"
        className="mt-6 flex flex-col gap-2 sm:max-w-md sm:flex-row"
      >
        <input type="hidden" name="categoria" value={category.slug} />
        <Input
          name="ciudad"
          placeholder={t("cityPlaceholder")}
          aria-label={tc("filterCity")}
          className="flex-1"
        />
        <Button type="submit" className="w-full sm:w-auto">
          {th("search")}
        </Button>
      </form>

      {count === 0 ? (
        <div className="mt-12 space-y-3 text-center">
          <p className="text-muted-foreground">{tc("empty")}</p>
          <Button asChild>
            <Link href="/registrar-empresa">{tc("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.businesses.map((biz) => (
            <BusinessCard key={biz.id} business={biz} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
