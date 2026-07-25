"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  acceptEstimate,
  rejectEstimate,
  type PublicEstimateView,
} from "@/actions/public-estimate";
import { formatMoney } from "@/lib/date-range";

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  VIEWED: "Visto",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Expirado",
  VOID: "Anulado",
};

export function PublicEstimateClient({
  token,
  estimate,
}: {
  token: string;
  estimate: PublicEstimateView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onAccept() {
    startTransition(async () => {
      const res = await acceptEstimate({ token });
      if (res.ok) {
        toast.success("Presupuesto aceptado. Gracias.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function onReject() {
    startTransition(async () => {
      const res = await rejectEstimate({ token });
      if (res.ok) {
        toast.message("Presupuesto rechazado.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background px-4 py-8 print:max-w-none print:px-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          {estimate.businessLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={estimate.businessLogoUrl}
              alt=""
              className="mb-3 h-12 w-auto object-contain"
            />
          ) : null}
          <h1 className="text-xl font-bold tracking-tight">
            {estimate.businessName}
          </h1>
          {estimate.businessCity ? (
            <p className="text-sm text-muted-foreground">{estimate.businessCity}</p>
          ) : null}
        </div>
        <Badge variant="secondary">
          {statusLabel[estimate.status] ?? estimate.status}
        </Badge>
      </div>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">
          Presupuesto #{estimate.number}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="size-3.5" />
          PDF / Imprimir
        </Button>
      </div>

      {estimate.contactName ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Para: {estimate.contactName}
        </p>
      ) : null}

      <ul className="divide-y rounded-xl border">
        {estimate.lines.map((line, i) => (
          <li key={i} className="flex justify-between gap-3 px-3 py-3 text-sm">
            <div>
              <p className="font-medium">{line.description}</p>
              <p className="text-xs text-muted-foreground">
                {line.quantity} × {formatMoney(line.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 font-medium">{formatMoney(line.amount)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMoney(estimate.subtotal)}</span>
        </div>
        {estimate.taxRate > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Impuesto ({estimate.taxRate}%)
            </span>
            <span>{formatMoney(estimate.taxAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(estimate.total)}</span>
        </div>
      </div>

      {estimate.notes ? (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
          {estimate.notes}
        </p>
      ) : null}

      {estimate.validUntil ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Válido hasta{" "}
          {new Date(estimate.validUntil).toLocaleDateString("es-US")}
        </p>
      ) : null}

      {estimate.status === "ACCEPTED" ? (
        <p className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          Presupuesto aceptado
          {estimate.invoiceStatus
            ? ` · Factura ${estimate.invoiceStatus === "PAID" ? "pagada" : "pendiente"}`
            : ""}
          .
        </p>
      ) : null}

      {estimate.status === "REJECTED" ? (
        <p className="mt-6 rounded-lg border px-3 py-3 text-sm text-muted-foreground">
          Este presupuesto fue rechazado.
        </p>
      ) : null}

      {estimate.canRespond ? (
        <div className="mt-6 flex flex-col gap-2 print:hidden sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={pending}
            onClick={onAccept}
          >
            <Check className="size-4" />
            Aceptar presupuesto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={onReject}
          >
            <X className="size-4" />
            Rechazar
          </Button>
        </div>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground print:hidden">
        Enviado con Konnect
      </p>
    </div>
  );
}
