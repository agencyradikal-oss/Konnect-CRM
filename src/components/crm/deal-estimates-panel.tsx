"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createEstimate,
  listEstimatesForDeal,
  markInvoicePaid,
  sendEstimate,
  voidEstimate,
} from "@/actions/estimates";
import { formatMoney } from "@/lib/date-range";

type Line = { description: string; quantity: string; unitPrice: string };

type EstimateRow = {
  id: string;
  number: number;
  status: string;
  total: number;
  taxRate: number;
  notes: string | null;
  invoice: {
    id: string;
    status: string;
    number: number;
    paidAt: string | Date | null;
  } | null;
  lineItems?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
};

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  VIEWED: "Visto",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Expirado",
  VOID: "Anulado",
};

function whatsappShareUrl(phone: string | null, text: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  const q = encodeURIComponent(text);
  return digits
    ? `https://wa.me/${digits}?text=${q}`
    : `https://wa.me/?text=${q}`;
}

export function DealEstimatesPanel({
  dealId,
  canUseEstimates,
}: {
  dealId: string;
  canUseEstimates: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<EstimateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  function reload() {
    setLoading(true);
    startTransition(async () => {
      const res = await listEstimatesForDeal(dealId);
      if (res.ok) setItems(res.items as EstimateRow[]);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!canUseEstimates) {
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, canUseEstimates]);

  if (!canUseEstimates) {
    return (
      <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
        Presupuestos en plan Pro/Premium.{" "}
        <Link href="/app/plan" className="text-primary underline">
          Ver planes
        </Link>
      </div>
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function create() {
    const parsed = lines
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      }))
      .filter((l) => l.description && l.quantity > 0);

    if (parsed.length === 0) {
      toast.error("Agrega al menos una línea válida.");
      return;
    }

    startTransition(async () => {
      const res = await createEstimate({
        dealId,
        notes: notes || null,
        taxRate: Number(taxRate) || 0,
        lines: parsed,
      });
      if (res.ok) {
        toast.success("Presupuesto creado.");
        setShowForm(false);
        setNotes("");
        setLines([{ description: "", quantity: "1", unitPrice: "" }]);
        reload();
      } else toast.error(res.error);
    });
  }

  function onSend(estimateId: string) {
    startTransition(async () => {
      const res = await sendEstimate({ estimateId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.emailed
          ? "Enviado por email. También puedes compartir por WhatsApp."
          : "Enlace listo (sin email en el contacto).",
      );
      if (res.publicUrl) {
        const text = `Hola, aquí tienes tu presupuesto: ${res.publicUrl}`;
        window.open(whatsappShareUrl(res.contactPhone, text), "_blank");
        await navigator.clipboard.writeText(res.publicUrl).catch(() => null);
      }
      reload();
    });
  }

  function onVoid(estimateId: string) {
    startTransition(async () => {
      const res = await voidEstimate({ estimateId });
      if (res.ok) {
        toast.success("Presupuesto anulado.");
        reload();
      } else toast.error(res.error);
    });
  }

  function onMarkPaid(invoiceId: string) {
    startTransition(async () => {
      const res = await markInvoicePaid({ invoiceId });
      if (res.ok) {
        toast.success("Factura marcada como pagada.");
        reload();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-primary" />
          Presupuestos
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="size-3.5" />
          Nuevo
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-3 rounded-lg border p-3">
          {lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Label className="text-xs">Descripción</Label>
                <Input
                  value={line.description}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, description: e.target.value } : l,
                      ),
                    )
                  }
                  placeholder="Servicio o producto"
                />
              </div>
              <div>
                <Label className="text-xs">Cant.</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, quantity: e.target.value } : l,
                      ),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Precio</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, unitPrice: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setLines((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={addLine}>
            + Línea
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Impuesto %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condiciones, validez…"
              />
            </div>
          </div>
          <Button type="button" disabled={pending} onClick={create}>
            Guardar borrador
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Cargando…
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin presupuestos aún.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{e.number}</span>
                  <Badge variant="secondary">
                    {statusLabel[e.status] ?? e.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatMoney(e.total)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(e.status === "DRAFT" ||
                    e.status === "SENT" ||
                    e.status === "VIEWED") && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => onSend(e.id)}
                    >
                      <Mail className="size-3.5" />
                      Enviar
                    </Button>
                  )}
                  {e.status !== "ACCEPTED" && e.status !== "VOID" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => onVoid(e.id)}
                    >
                      Anular
                    </Button>
                  ) : null}
                  {e.invoice?.status === "PENDING" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onMarkPaid(e.invoice!.id)}
                    >
                      Marcar pagada
                    </Button>
                  ) : null}
                  {e.invoice?.status === "PAID" ? (
                    <Badge>Factura pagada</Badge>
                  ) : null}
                </div>
              </div>
              {(e.status === "SENT" || e.status === "VIEWED") && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="size-3" />
                  Al enviar se abre WhatsApp con el enlace público.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
