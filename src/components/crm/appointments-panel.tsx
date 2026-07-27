"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAppointment } from "@/actions/appointments";
import {
  AgendaCalendar,
  type AgendaAppointment,
  type AgendaTask,
} from "@/components/crm/agenda-calendar";

export type AppointmentRow = Omit<AgendaAppointment, "kind">;

export type TaskRow = Omit<AgendaTask, "kind">;

export function AppointmentsPanel({
  appointments,
  tasks,
  canSyncCalendar,
  prefill,
}: {
  appointments: AppointmentRow[];
  tasks: TaskRow[];
  canSyncCalendar: boolean;
  prefill?: {
    title?: string;
    leadId?: string;
    dealId?: string;
    contactId?: string;
    notes?: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState("MEASURE");

  function onCreate(fd: FormData) {
    const date = String(fd.get("date") ?? "");
    const time = String(fd.get("time") ?? "09:00");
    const duration = Number(fd.get("duration") ?? 60);
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    startTransition(async () => {
      const res = await createAppointment({
        type,
        title: String(fd.get("title") ?? ""),
        notes: String(fd.get("notes") ?? "") || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        address: String(fd.get("address") ?? "") || undefined,
        city: String(fd.get("city") ?? "") || undefined,
        zip: String(fd.get("zip") ?? "") || undefined,
        leadId: String(fd.get("leadId") ?? "") || null,
        dealId: String(fd.get("dealId") ?? "") || null,
        contactId: String(fd.get("contactId") ?? "") || null,
        syncCalendar: canSyncCalendar,
      });
      if (res.ok) toast.success("Cita creada.");
      else toast.error(res.error ?? "No se pudo crear.");
    });
  }

  const linked =
    prefill?.leadId || prefill?.dealId || prefill?.contactId ? true : false;

  return (
    <div className="space-y-6">
      <AgendaCalendar appointments={appointments} tasks={tasks} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            Agendar medida / visita
          </CardTitle>
          <CardDescription>
            Guarda la cita en Konnect
            {canSyncCalendar
              ? " y la sincroniza con Google Calendar si está conectado."
              : ". Actualiza a Pro/Premium para sync con Calendar."}
            {linked && " Vinculada al lead/deal de origen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onCreate} className="grid gap-3 sm:grid-cols-2">
            {prefill?.leadId && (
              <input type="hidden" name="leadId" value={prefill.leadId} />
            )}
            {prefill?.dealId && (
              <input type="hidden" name="dealId" value={prefill.dealId} />
            )}
            {prefill?.contactId && (
              <input type="hidden" name="contactId" value={prefill.contactId} />
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={prefill?.title}
                placeholder="Medida — Cliente García"
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
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={60}
                min={30}
                max={240}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" required disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                name="time"
                type="time"
                defaultValue="09:00"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Dirección del cliente</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" placeholder="Norcross" disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" placeholder="30071" disabled={pending} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={prefill?.notes}
                disabled={pending}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                Guardar cita
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
