import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import {
  BusinessModerationActions,
  ReviewModerationActions,
} from "@/components/admin/moderation-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireSuperAdmin();

  const [pendingBusinesses, pendingReviews, allBusinesses, userStats] =
    await Promise.all([
      prisma.business.findMany({
        where: { status: "PENDING" },
        include: {
          category: { select: { nameEs: true } },
          users: { select: { email: true, name: true }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.review.findMany({
        where: { approved: false },
        include: {
          business: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.business.findMany({
        where: { status: { not: "PENDING" } },
        include: {
          category: { select: { nameEs: true } },
          _count: { select: { leads: true, users: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
    ]);

  const totalUsers = userStats.reduce((s, r) => s + r._count._all, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Moderación <span className="text-primary">Konnect™</span>
          </h1>
          <p className="text-muted-foreground">
            {pendingBusinesses.length} negocio
            {pendingBusinesses.length === 1 ? "" : "s"} y {pendingReviews.length}{" "}
            reseña{pendingReviews.length === 1 ? "" : "s"} pendientes ·{" "}
            {totalUsers} usuarios
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/usuarios">Gestionar usuarios</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {userStats.map((s) => (
          <Card key={s.role}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.role.replace("_", " ")}
              </p>
              <p className="mt-1 text-2xl font-bold">{s._count._all}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Negocios pendientes de aprobación</CardTitle>
          <CardDescription>
            Aprobar publica el perfil y envía email al dueño. Rechazar lo suspende.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pendingBusinesses.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground">
              No hay negocios pendientes.
            </p>
          ) : (
            <div className="divide-y">
              {pendingBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex gap-4">
                    {biz.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="size-16 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg bg-primary/15 text-xl font-bold text-primary">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/negocio/${biz.slug}`}
                        className="font-semibold hover:text-primary"
                        target="_blank"
                      >
                        {biz.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {biz.category.nameEs}
                        {biz.city ? ` · ${biz.city}, GA` : ""}
                      </p>
                      {biz.description && (
                        <p className="mt-1 line-clamp-2 max-w-lg text-sm text-muted-foreground">
                          {biz.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dueño: {biz.users[0]?.name ?? "—"} (
                        {biz.users[0]?.email ?? biz.email ?? "sin email"})
                      </p>
                    </div>
                  </div>
                  <BusinessModerationActions businessId={biz.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reseñas pendientes</CardTitle>
          <CardDescription>
            Solo las reseñas aprobadas aparecen en el perfil público.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pendingReviews.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground">
              No hay reseñas pendientes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autor</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Comentario</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <p className="font-medium">{review.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.authorEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/negocio/${review.business.slug}`}
                        className="hover:text-primary"
                        target="_blank"
                      >
                        {review.business.name}
                      </Link>
                    </TableCell>
                    <TableCell>{review.rating}/5</TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                      {review.comment ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ReviewModerationActions reviewId={review.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Otros negocios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Usuarios</TableHead>
                <TableHead className="hidden lg:table-cell">Leads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBusinesses.map((biz) => (
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
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        biz.status === "ACTIVE"
                          ? "border-0 bg-emerald-100 text-emerald-700"
                          : "border-0 bg-red-100 text-red-700"
                      }
                    >
                      {biz.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {biz._count.users}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {biz._count.leads}
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
