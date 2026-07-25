"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Mail, RefreshCw, Trash2 } from "lucide-react";
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
  assignClaimEmail,
  regenerateClaimToken,
  revokeClaimInvite,
  sendClaimInvite,
} from "@/actions/admin-claim";

export type ClaimRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  claimEmail: string | null;
  tokenExpiresAt: string | null;
  hasToken: boolean;
  tokenExpired: boolean;
};

export function ClaimAdminPanel({ rows }: { rows: ClaimRow[] }) {
  const [pending, startTransition] = useTransition();

  function onAssign(businessId: string, fd: FormData) {
    const email = String(fd.get("email") ?? "");
    startTransition(async () => {
      const res = await assignClaimEmail({ businessId, email });
      if (res.ok) {
        toast.success("Email asignado y token generado. Envía la invitación.");
      } else {
        toast.error(res.error);
      }
    });
  }

  function onSend(businessId: string) {
    startTransition(async () => {
      const res = await sendClaimInvite({ businessId });
      if (res.ok) toast.success("Invitación enviada.");
      else toast.error(res.error);
    });
  }

  function onRegen(businessId: string) {
    startTransition(async () => {
      const res = await regenerateClaimToken({ businessId });
      if (res.ok) toast.success("Token regenerado. Vuelve a enviar la invitación.");
      else toast.error(res.error);
    });
  }

  function onRevoke(businessId: string) {
    startTransition(async () => {
      const res = await revokeClaimInvite({ businessId });
      if (res.ok) toast.success("Reclamo revocado.");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          Negocios sin reclamar
        </CardTitle>
        <CardDescription>
          Asigna el correo del dueño, genera el token e envía la invitación.
          El cliente debe entrar con ese mismo email.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay negocios ACTIVE sin dueño.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Email reclamo</TableHead>
                <TableHead>Token</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      /{row.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <form
                      className="flex max-w-xs flex-col gap-2 sm:flex-row sm:items-end"
                      action={(fd) => onAssign(row.id, fd)}
                    >
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`claim-email-${row.id}`}
                          className="sr-only"
                        >
                          Email
                        </Label>
                        <Input
                          id={`claim-email-${row.id}`}
                          name="email"
                          type="email"
                          required
                          defaultValue={row.claimEmail ?? ""}
                          placeholder="dueno@empresa.com"
                          disabled={pending}
                        />
                      </div>
                      <Button type="submit" size="sm" disabled={pending}>
                        Guardar
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    {!row.claimEmail ? (
                      <Badge variant="secondary">Sin email</Badge>
                    ) : !row.hasToken ? (
                      <Badge variant="secondary">Sin token</Badge>
                    ) : row.tokenExpired ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge>Activo</Badge>
                        {row.tokenExpiresAt ? (
                          <p className="text-xs text-muted-foreground">
                            Hasta{" "}
                            {new Date(row.tokenExpiresAt).toLocaleDateString(
                              "es-US",
                            )}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={pending || !row.claimEmail}
                        onClick={() => onSend(row.id)}
                      >
                        <Mail className="size-3.5" />
                        Enviar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending || !row.claimEmail}
                        onClick={() => onRegen(row.id)}
                      >
                        <RefreshCw className="size-3.5" />
                        Regenerar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending || (!row.claimEmail && !row.hasToken)}
                        onClick={() => onRevoke(row.id)}
                      >
                        <Trash2 className="size-3.5" />
                        Revocar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
