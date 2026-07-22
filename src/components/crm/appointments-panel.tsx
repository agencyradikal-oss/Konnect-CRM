"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { createAppointment, cancelAppointment } from "@/actions/appointments";

export type AppointmentRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  address: string | null;
  city: string | null;
  mapsUrl: string | null;
  googleEventId: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  MEASURE: "Medida",
  VISIT: "Visita",
  CALL: "Llamada",
  OTHER: "Otro",
};

export function AppointmentsPanel({
  appointments,
  canSyncCalendar,
}: {
  appointments: AppointmentRow[];
  canSyncCalendar: boolean;
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
        syncCalendar: canSyncCalendar,
      });
      if (res.ok) toast.success("Cita creada.");
      else toast.error(res.error ?? "No se pudo crear.");
    });
  }

  return (
    <div className="space-y-6">
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onCreate} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                required
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
              <Textarea id="notes" name="notes" rows={2} disabled={pending} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                Guardar cita
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Próximas citas</h2>
        {appointments.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay citas.</p>
        )}
        {appointments.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Badge variant="secondary">{TYPE_LABEL[a.type] ?? a.type}</Badge>
                  <Badge variant={a.status === "CANCELED" ? "outline" : "default"}>
                    {a.status}
                  </Badge>
                  {a.googleEventId && (
                    <Badge variant="outline">Calendar</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(a.startsAt).toLocaleString("es-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {(a.address || a.city) && (
                  <p className="flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {[a.address, a.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {a.mapsUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={a.mapsUrl} target="_blank" rel="noopener noreferrer">
                      Maps <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                )}
                {a.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await cancelAppointment({ id: a.id });
                        if (res.ok) toast.success("Cita cancelada.");
                        else toast.error(res.error ?? "Error");
                      })
                    }
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
