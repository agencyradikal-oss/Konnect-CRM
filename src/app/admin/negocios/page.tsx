import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  AdminBusinessList,
  type AdminBusinessRow,
} from "@/components/admin/admin-business-list";

export const metadata: Metadata = {
  title: "Negocios",
};

export const dynamic = "force-dynamic";

export default async function AdminNegociosPage() {
  await requireSuperAdmin();

  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
      claimedAt: true,
      category: { select: { nameEs: true } },
      users: {
        where: { role: { in: ["BUSINESS_OWNER", "BUSINESS_STAFF"] } },
        select: { name: true, email: true, role: true },
        orderBy: { role: "asc" },
      },
    },
  });

  const rows: AdminBusinessRow[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    city: b.city,
    status: b.status,
    claimedAt: b.claimedAt?.toISOString() ?? null,
    categoryName: b.category.nameEs,
    users: b.users,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
          <p className="text-muted-foreground">
            Carga empresas locales reales al directorio y luego asígnalas a un
            dueño o staff en Usuarios.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/negocios/nuevo">Nuevo negocio</Link>
        </Button>
      </div>
      <AdminBusinessList rows={rows} />
    </div>
  );
}
