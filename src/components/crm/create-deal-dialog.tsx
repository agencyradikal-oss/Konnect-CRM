"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDeal } from "@/actions/crm";

type Props = {
  contactId: string;
  contactName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  variant?: "outline" | "secondary" | "default" | "ghost";
  size?: "sm" | "default";
  /** After create: navigate to deal sheet. Default true. */
  navigateToDeal?: boolean;
  onSuccess?: (dealId: string) => void;
};

export function CreateDealDialog({
  contactId,
  contactName,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "Nuevo deal",
  variant = "secondary",
  size = "sm",
  navigateToDeal = true,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [pending, startTransition] = useTransition();
  const defaultTitle = `Deal — ${contactName}`;

  function onSubmit(fd: FormData) {
    const title = String(fd.get("title") ?? "").trim() || defaultTitle;
    const valueRaw = String(fd.get("value") ?? "").trim();

    startTransition(async () => {
      try {
        const res = await createDeal({
          contactId,
          title,
          value: valueRaw || undefined,
        });
        if (!res.ok) {
          toast.error(res.error ?? "No se pudo crear el deal.");
          return;
        }
        toast.success("Deal creado.");
        setOpen(false);
        onSuccess?.(res.dealId);
        if (navigateToDeal) {
          router.push(`/app/deals?deal=${res.dealId}`);
        }
      } catch {
        toast.error("No se pudo crear el deal. Intenta de nuevo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button type="button" variant={variant} size={size}>
            <Plus className="size-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo deal</DialogTitle>
          <DialogDescription>
            Se abre el pipeline en etapa Nuevo para {contactName}.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cd-title">Título</Label>
            <Input
              id="cd-title"
              name="title"
              defaultValue={defaultTitle}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd-value">Valor estimado (opcional)</Label>
            <Input
              id="cd-value"
              name="value"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
