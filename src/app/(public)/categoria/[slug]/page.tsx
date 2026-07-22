import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { BusinessCard } from "@/components/directory/business-card";
import {
  DirectoryNav,
  breadcrumbJsonLd,
} from "@/components/directory/directory-nav";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return {};
    return {
      title: `${category.nameEs} en Atlanta`,
      description: `Negocios de ${category.nameEs.toLowerCase()} con atención en español en Atlanta metro.`,
      alternates: { canonical: `/categoria/${category.slug}` },
    };
  } catch {
    return {};
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("directory");

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

  const crumbsLd = breadcrumbJsonLd(getAppBaseUrl(), [
    { name: t("home"), path: "/" },
    { name: t("title"), path: "/directorio" },
    { name: category.nameEs, path: `/categoria/${category.slug}` },
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
          { label: category.nameEs },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {category.nameEs}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {category.businesses.length} negocio
        {category.businesses.length === 1 ? "" : "s"} en esta categoría
      </p>

      {category.businesses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Aún no hay negocios en esta categoría.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.businesses.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>
      )}
    </div>
  );
}
