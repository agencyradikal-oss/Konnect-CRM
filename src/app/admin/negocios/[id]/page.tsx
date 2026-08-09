import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBusinessForm } from "@/components/admin/admin-business-form";
import { parseBusinessSocials } from "@/lib/business-socials";
import { normalizeWeekHours } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Editar negocio",
};

export const dynamic = "force-dynamic";

export default async function AdminEditarNegocioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const [business, categories] = await Promise.all([
    prisma.business.findUnique({
      where: { id },
      include: { category: { select: { nameEs: true } } },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { nameEs: "asc" },
      select: { id: true, nameEs: true },
    }),
  ]);

  if (!business) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
          <p className="text-muted-foreground">
            /negocio/{business.slug} · {business.category.nameEs}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/negocio/${business.slug}`} target="_blank">
              Ver ficha
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/negocios">Volver</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editar ficha pública</CardTitle>
          <CardDescription>
            Los cambios se reflejan en el directorio. Para asignar dueño o staff
            usa Usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBusinessForm
            businessId={business.id}
            categories={categories}
            initial={{
              name: business.name,
              slug: business.slug,
              categoryId: business.categoryId,
              description: business.description ?? "",
              languages: business.languages,
              phone: business.phone ?? "",
              whatsapp: business.whatsapp ?? "",
              email: business.email ?? "",
              website: business.website ?? "",
              address: business.address ?? "",
              city: business.city ?? "",
              state: business.state ?? "GA",
              country: business.country ?? "US",
              zip: business.zip ?? "",
              socials: parseBusinessSocials(business.socials),
              logoUrl: business.logoUrl,
              coverUrl: business.coverUrl,
              hours: normalizeWeekHours(business.hours),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
