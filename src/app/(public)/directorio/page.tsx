import type { Metadata } from "next";
import { Search } from "lucide-react";
import type { Business, Category } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { BusinessCard } from "@/components/directory/business-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Directorio de negocios",
  description:
    "Busca negocios hispanos en Atlanta metro por nombre, categoría o ciudad.",
  alternates: { canonical: "/directorio" },
};

type ListedBusiness = Business & { category: Category };

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string }>;
}) {
  const t = await getTranslations("directory");
  const th = await getTranslations("home");
  const { q, ciudad } = await searchParams;

  let businesses: ListedBusiness[] = [];
  let dbError = false;

  try {
    businesses = await prisma.business.findMany({
      where: {
        status: "ACTIVE",
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { nameEs: { contains: q, mode: "insensitive" } } },
          ],
        }),
        ...(ciudad && { city: { contains: ciudad, mode: "insensitive" } }),
      },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  } catch (error) {
    dbError = true;
    console.error("[directorio] Database unavailable:", error);
  }

  const count = businesses.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">
        {t(count === 1 ? "found" : "found_plural", { count })}
      </p>
      {dbError && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {th("dbError")}
        </p>
      )}

      <form className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Input
          name="ciudad"
          defaultValue={ciudad}
          placeholder={t("cityPlaceholder")}
          className="sm:w-48"
        />
        <Button type="submit">{th("search")}</Button>
      </form>

      {businesses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>
      )}
    </div>
  );
}
