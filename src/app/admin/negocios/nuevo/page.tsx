import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBusinessForm } from "@/components/admin/admin-business-form";

export const metadata: Metadata = {
  title: "Nuevo negocio",
};

export const dynamic = "force-dynamic";

export default async function AdminNuevoNegocioPage() {
  await requireSuperAdmin();

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { nameEs: "asc" },
    select: { id: true, nameEs: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo negocio</h1>
          <p className="text-muted-foreground">
            Se publica de inmediato en el directorio (ACTIVE), sin dueño. Luego
            asígnalo en Usuarios.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/negocios">Volver</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ficha pública</CardTitle>
          <CardDescription>
            Teléfono y ciudad son obligatorios. El sitio web acepta URL sin
            https://.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBusinessForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
