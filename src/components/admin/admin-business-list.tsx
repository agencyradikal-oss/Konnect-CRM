"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { BusinessStatus, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setBusinessStatusAsAdmin } from "@/actions/admin-businesses";

export type AdminBusinessRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status: BusinessStatus;
  claimedAt: string | null;
  categoryName: string;
  users: { name: string | null; email: string; role: Role }[];
};

const STATUS_LABEL: Record<BusinessStatus, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
};

export function AdminBusinessList({ rows }: { rows: AdminBusinessRow[] }) {
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((b) => {
      const owners = b.users.map((u) => `${u.name ?? ""} ${u.email}`).join(" ");
      return (
        b.name.toLowerCase().includes(query) ||
        b.slug.toLowerCase().includes(query) ||
        (b.city?.toLowerCase().includes(query) ?? false) ||
        b.categoryName.toLowerCase().includes(query) ||
        owners.toLowerCase().includes(query)
      );
    });
  }, [rows, q]);

  function toggleStatus(b: AdminBusinessRow) {
    const next = b.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    startTransition(async () => {
      const res = await setBusinessStatusAsAdmin({
        businessId: b.id,
        status: next,
      });
      if (res.ok) {
        toast.success(
          next === "ACTIVE" ? "Negocio publicado." : "Negocio suspendido.",
        );
      } else {
        toast.error("No se pudo cambiar el estado.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fichas del directorio</CardTitle>
        <CardDescription>
          {filtered.length} de {rows.length} negocios
        </CardDescription>
        <Input
          placeholder="Buscar por nombre, slug, ciudad o dueño…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-sm"
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Equipo</TableHead>
              <TableHead className="min-w-[200px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No hay negocios con ese filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => {
                const owners = b.users.filter((u) => u.role === "BUSINESS_OWNER");
                const staff = b.users.filter((u) => u.role === "BUSINESS_STAFF");
                const claimed = Boolean(b.claimedAt) || owners.length > 0;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.city ?? "—"} · /negocio/{b.slug}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {b.categoryName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="secondary"
                          className={
                            b.status === "ACTIVE"
                              ? "w-fit border-0 bg-emerald-100 text-emerald-700"
                              : b.status === "SUSPENDED"
                                ? "w-fit border-0 bg-red-100 text-red-700"
                                : "w-fit border-0 bg-amber-100 text-amber-800"
                          }
                        >
                          {STATUS_LABEL[b.status]}
                        </Badge>
                        <Badge variant="outline" className="w-fit text-xs">
                          {claimed ? "Con dueño" : "Sin reclamar"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {owners.length === 0 && staff.length === 0 ? (
                        <span className="text-muted-foreground">Sin usuarios</span>
                      ) : (
                        <div className="space-y-1">
                          {owners.map((u) => (
                            <p key={u.email}>
                              Dueño · {u.name ?? u.email}
                            </p>
                          ))}
                          {staff.length > 0 && (
                            <p className="text-muted-foreground">
                              {staff.length} staff
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/negocios/${b.id}`}>Editar</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/negocio/${b.slug}`} target="_blank">
                            Ver
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/admin/usuarios">Asignar</Link>
                        </Button>
                        {b.status !== "PENDING" && (
                          <Button
                            size="sm"
                            variant={
                              b.status === "SUSPENDED" ? "default" : "outline"
                            }
                            disabled={pending}
                            onClick={() => toggleStatus(b)}
                          >
                            {b.status === "SUSPENDED" ? "Publicar" : "Suspender"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
