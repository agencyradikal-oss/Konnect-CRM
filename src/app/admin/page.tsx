import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, signOut } from "@/lib/auth";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default async function AdminPage() {
  await requireSuperAdmin();

  const businesses = await prisma.business.findMany({
    include: {
      category: { select: { nameEs: true } },
      _count: { select: { leads: true, reviews: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = businesses.filter((b) => b.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Panel de administración{" "}
            <span className="text-primary">Konnect™</span>
          </h1>
          <p className="text-muted-foreground">
            {pending} negocio{pending === 1 ? "" : "s"} pendiente
            {pending === 1 ? "" : "s"} de moderación
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" size="sm" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Negocios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                <TableHead className="hidden lg:table-cell">Leads</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell>
                    <Link
                      href={`/negocio/${biz.slug}`}
                      className="font-medium hover:text-primary"
                      target="_blank"
                    >
                      {biz.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {biz.category.nameEs}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {biz.city ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {biz._count.leads}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("border-0", statusStyles[biz.status])}
                    >
                      {biz.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ModerationActions businessId={biz.id} status={biz.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
