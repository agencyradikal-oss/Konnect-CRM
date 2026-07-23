"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointment } from "@/actions/appointments";

type Props = {
  defaultTitle: string;
  leadId?: string | null;
  dealId?: string | null;
  contactId?: string | null;
  triggerLabel?: string;
  variant?: "outline" | "secondary" | "default" | "ghost";
  size?: "sm" | "default" | "icon";
  /** Controlled mode (sin botón trigger). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export function ScheduleAppointmentDialog({
  defaultTitle,
  leadId,
  dealId,
  contactId,
  triggerLabel = "Agendar cita",
  variant = "outline",
  size = "sm",
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState("MEASURE");

  function onSubmit(fd: FormData) {
    const date = String(fd.get("date") ?? "");
    const time = String(fd.get("time") ?? "09:00");
    const duration = Number(fd.get("duration") ?? 60);
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    startTransition(async () => {
      const res = await createAppointment({
        type,
        title: String(fd.get("title") ?? defaultTitle),
        notes: String(fd.get("notes") ?? "") || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        address: String(fd.get("address") ?? "") || undefined,
        city: String(fd.get("city") ?? "") || undefined,
        zip: String(fd.get("zip") ?? "") || undefined,
        leadId: leadId || null,
        dealId: dealId || null,
        contactId: contactId || null,
        syncCalendar: true,
      });
      if (res.ok) {
        toast.success("Cita agendada.");
        setOpen(false);
      } else toast.error(res.error ?? "No se pudo agendar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button type="button" variant={variant} size={size}>
            <CalendarPlus className="size-4" />
            {size !== "icon" && <span>{triggerLabel}</span>}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar medida / visita</DialogTitle>
          <DialogDescription>
            Se guarda en Citas y, si Google Calendar está conectado, se
            sincroniza.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sa-title">Título</Label>
            <Input
              id="sa-title"
              name="title"
              defaultValue={defaultTitle}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEASURE">Medida</SelectItem>
                <SelectItem value="VISIT">Visita</SelectItem>
                <SelectItem value="CALL">Llamada</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sa-date">Fecha</Label>
              <Input
                id="sa-date"
                name="date"
                type="date"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-time">Hora</Label>
              <Input
                id="sa-time"
                name="time"
                type="time"
                defaultValue="09:00"
                required
                disabled={pending}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-duration">Duración (min)</Label>
            <Input
              id="sa-duration"
              name="duration"
              type="number"
              defaultValue={60}
              min={30}
              max={240}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-address">Dirección</Label>
            <Input id="sa-address" name="address" disabled={pending} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sa-city">Ciudad</Label>
              <Input id="sa-city" name="city" disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-zip">ZIP</Label>
              <Input id="sa-zip" name="zip" disabled={pending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-notes">Notas</Label>
            <Textarea id="sa-notes" name="notes" rows={2} disabled={pending} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
