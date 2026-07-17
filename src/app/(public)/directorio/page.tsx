import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { BusinessCard } from "@/components/directory/business-card";

export const metadata: Metadata = {
  title: "Directorio de negocios",
  description:
    "Busca negocios hispanos en Atlanta metro por nombre, categoría o ciudad.",
};

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ciudad?: string }>;
}) {
  const { q, ciudad } = await searchParams;

  const businesses = await prisma.business.findMany({
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Directorio</h1>
      <p className="mt-1 text-muted-foreground">
        {businesses.length} negocio{businesses.length === 1 ? "" : "s"} encontrado
        {businesses.length === 1 ? "" : "s"}
      </p>

      <form className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Buscar negocio o servicio..." className="pl-9" />
        </div>
        <Input
          name="ciudad"
          defaultValue={ciudad}
          placeholder="Ciudad (ej. Norcross)"
          className="sm:w-48"
        />
        <Button type="submit">Buscar</Button>
      </form>

      {businesses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No encontramos negocios con esos filtros.
        </p>
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
