import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BusinessCard } from "@/components/directory/business-card";

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
    };
  } catch {
    return {};
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{category.nameEs}</h1>
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
