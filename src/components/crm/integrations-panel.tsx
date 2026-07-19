"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  Webhook,
  Store,
  BookOpen,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
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
import { openBillingPortal } from "@/actions/billing";
import {
  rotateWebhookSecret,
  updateOutboundWebhook,
} from "@/actions/integrations";
import { DEVELOPERS_CONTACT } from "@/content/legal/meta";

export type IntegrationsInitial = {
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookEnabled: boolean;
  isOwner: boolean;
};

export function IntegrationsPanel({ initial }: { initial: IntegrationsInitial }) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(initial.webhookUrl ?? "");
  const [enabled, setEnabled] = useState(initial.webhookEnabled);
  const [secret, setSecret] = useState(initial.webhookSecret ?? "");

  const stripeConnected = Boolean(initial.stripeCustomerId);

  function copySecret() {
    if (!secret) return;
    void navigator.clipboard.writeText(secret);
    toast.success("Secret copiado.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <CreditCard className="size-5" />
              </span>
              <div>
                <CardTitle>Stripe (plan Konnect)</CardTitle>
                <CardDescription>
                  Suscripción Free / Pro / Premium que cobra Konnect al negocio.
                  No es cobro a tus clientes finales.
                </CardDescription>
              </div>
            </div>
            <Badge variant={stripeConnected ? "default" : "secondary"}>
              {stripeConnected ? "Conectado" : "Sin suscripción paga"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <p className="w-full text-sm text-muted-foreground">
            Plan actual: <strong>{initial.plan}</strong>
            {initial.stripeSubscriptionId
              ? ` · sub ${initial.stripeSubscriptionId.slice(0, 18)}…`
              : ""}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/plan">Ver / cambiar plan</Link>
          </Button>
          {stripeConnected && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const res = await openBillingPortal();
                    if (res && "ok" in res && !res.ok) {
                      toast.error(res.error);
                    }
                  } catch {
                    // redirect() lanza; en error real mostramos toast
                  }
                })
              }
            >
              Portal de facturación
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Webhook className="size-5" />
            </span>
            <div>
              <CardTitle>Webhook de salida (lead.created)</CardTitle>
              <CardDescription>
                Envía cada lead de El Puente a Zapier, Make, Square o QuickBooks.
                Firma: header <code className="text-xs">X-Konnect-Signature</code>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!initial.isOwner && (
            <p className="text-sm text-amber-700">
              Solo el dueño (BUSINESS_OWNER) puede editar el webhook.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="webhookUrl">URL HTTPS (Catch Hook / endpoint)</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/…"
              value={url}
              disabled={!initial.isOwner || pending}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              disabled={!initial.isOwner || pending}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Webhook activo
          </label>
          {secret && (
            <div className="space-y-1.5">
              <Label>Webhook secret</Label>
              <div className="flex gap-2">
                <Input readOnly value={secret} className="font-mono text-xs" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copySecret}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
          {initial.isOwner && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const res = await updateOutboundWebhook({
                        webhookUrl: url,
                        webhookEnabled: enabled,
                      });
                      if (res.ok) {
                        if (res.secret) setSecret(res.secret);
                        toast.success("Webhook guardado.");
                      } else if ("error" in res) {
                        toast.error(res.error);
                      }
                    } catch (e) {
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : "No se pudo guardar.",
                      );
                    }
                  })
                }
              >
                Guardar webhook
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !secret}
                onClick={() =>
                  startTransition(async () => {
                    const res = await rotateWebhookSecret();
                    if (res.ok) {
                      setSecret(res.secret);
                      toast.success("Secret regenerado.");
                    }
                  })
                }
              >
                <RefreshCw className="size-4" /> Rotar secret
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/developers">
                  Docs <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Store className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Square</CardTitle>
                <CardDescription>
                  POS / pagos de tu negocio. Hoy: webhook → Zapier → Square.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="secondary">Roadmap · OAuth nativo Fase 2</Badge>
            <p className="text-sm text-muted-foreground">
              Configura el webhook arriba con un Catch Hook de Zapier y usa la
              acción “Create Customer” o Invoice en Square.
            </p>
            <Button asChild size="sm" variant="outline">
              <a
                href={`mailto:${DEVELOPERS_CONTACT}?subject=${encodeURIComponent("[Konnect] Early access Square")}`}
              >
                Solicitar early access
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">QuickBooks</CardTitle>
                <CardDescription>
                  Contabilidad. Hoy: webhook → Make/Zapier → QBO.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="secondary">Roadmap · OAuth nativo Fase 2</Badge>
            <p className="text-sm text-muted-foreground">
              Mismo flujo: lead.created → automatización → Create Customer /
              Estimate en QuickBooks Online.
            </p>
            <Button asChild size="sm" variant="outline">
              <a
                href={`mailto:${DEVELOPERS_CONTACT}?subject=${encodeURIComponent("[Konnect] Early access QuickBooks")}`}
              >
                Solicitar early access
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
