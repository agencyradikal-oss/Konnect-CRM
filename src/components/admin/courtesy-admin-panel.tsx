"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Gift, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  grantPlanCourtesy,
  revokePlanCourtesy,
  syncPlanCourtesy,
} from "@/actions/admin-courtesy";

export type CourtesyRow = {
  id: string;
  email: string;
  plan: string;
  note: string | null;
  businessId: string | null;
  businessName: string | null;
  grantedAt: string;
  revokedAt: string | null;
};

export function CourtesyAdminPanel({ rows }: { rows: CourtesyRow[] }) {
  const [pending, startTransition] = useTransition();

  function onGrant(fd: FormData) {
    const email = String(fd.get("email") ?? "");
    const note = String(fd.get("note") ?? "");
    startTransition(async () => {
      const res = await grantPlanCourtesy({
        email,
        note: note || undefined,
      });
      if (res.ok) {
        toast.success(
          res.applied
            ? "Cortesía otorgada y aplicada al negocio."
            : "Cortesía registrada. Se aplicará cuando el socio tenga negocio.",
        );
      } else {
        toast.error("No se pudo otorgar la cortesía.");
      }
    });
  }

  function onRevoke(email: string) {
    startTransition(async () => {
      const res = await revokePlanCourtesy({ email });
      if (res.ok) toast.success("Cortesía revocada.");
      else toast.error(res.error ?? "No se pudo revocar.");
    });
  }

  function onSync(email: string) {
    startTransition(async () => {
      const res = await syncPlanCourtesy({ email });
      if (res.applied) toast.success("Premium de cortesía aplicado.");
      else toast.message("Aún no hay negocio vinculado a ese email.");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            Otorgar Premium lifetime
          </CardTitle>
          <CardDescription>
            Socios con cortesía reciben Premium sin Stripe. Agrega el email de la
            cuenta Clerk/Prisma; si ya tienen negocio, se aplica al instante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onGrant} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="courtesy-email">Email</Label>
              <Input
                id="courtesy-email"
                name="email"
                type="email"
                required
                placeholder="socio@empresa.com"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="courtesy-note">Nota (opcional)</Label>
              <Input
                id="courtesy-note"
                name="note"
                placeholder="Socio — lifetime cortesía"
                disabled={pending}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                Otorgar cortesía
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de socios</CardTitle>
          <CardDescription>
            Activos y revocados. “Pendiente” = email registrado, sin negocio aún.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No hay entitlements aún.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const active = !row.revokedAt;
                const status = !active
                  ? "Revocado"
                  : row.businessId
                    ? "Aplicado"
                    : "Pendiente";
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "Aplicado"
                            ? "default"
                            : status === "Pendiente"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.businessName ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {row.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {active && !row.businessId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => onSync(row.email)}
                          >
                            <RefreshCw className="size-3.5" />
                            Sync
                          </Button>
                        )}
                        {active && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => onRevoke(row.email)}
                          >
                            Revocar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
