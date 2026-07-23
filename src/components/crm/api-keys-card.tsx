"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Copy, Trash2 } from "lucide-react";
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
  createBusinessApiKey,
  revokeBusinessApiKey,
} from "@/actions/api-keys";

export type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function ApiKeysCard({
  keys,
  isOwner,
}: {
  keys: ApiKeyRow[];
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<string | null>(null);

  function onCreate(fd: FormData) {
    startTransition(async () => {
      const res = await createBusinessApiKey({
        name: String(fd.get("name") ?? "Partner"),
      });
      if (res.ok) {
        setRevealed(res.secret);
        toast.success("API key creada. Cópiala ahora — no se vuelve a mostrar.");
      } else toast.error(res.error ?? "Error");
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">API keys (partners)</CardTitle>
            <CardDescription>
              Bearer <code className="text-xs">kn_live_…</code> para{" "}
              <code className="text-xs">GET /api/v1/leads</code>. Máx. 5 activas.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {revealed && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-medium">Guarda esta key (solo una vez):</p>
            <code className="mt-1 block break-all text-xs">{revealed}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(revealed);
                toast.success("Copiada.");
              }}
            >
              <Copy className="size-3.5" /> Copiar
            </Button>
          </div>
        )}

        {isOwner && (
          <form action={onCreate} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 space-y-1">
              <Label htmlFor="api-key-name" className="sr-only">
                Nombre
              </Label>
              <Input
                id="api-key-name"
                name="name"
                placeholder="Zapier / Partner"
                required
                disabled={pending}
              />
            </div>
            <Button type="submit" disabled={pending}>
              Crear key
            </Button>
          </form>
        )}

        <ul className="space-y-2">
          {keys.length === 0 && (
            <li className="text-sm text-muted-foreground">Sin keys aún.</li>
          )}
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-muted-foreground">
                  {k.prefix}… ·{" "}
                  {k.revokedAt
                    ? "Revocada"
                    : k.lastUsedAt
                      ? `Usada ${new Date(k.lastUsedAt).toLocaleString("es-US")}`
                      : "Nunca usada"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {k.revokedAt ? (
                  <Badge variant="outline">Revocada</Badge>
                ) : (
                  <Badge>Activa</Badge>
                )}
                {isOwner && !k.revokedAt && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await revokeBusinessApiKey({ id: k.id });
                        if (res.ok) toast.success("Key revocada.");
                        else toast.error(res.error ?? "Error");
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
