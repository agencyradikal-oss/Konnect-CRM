"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createPublicBooking,
  getPublicBookingSlots,
} from "@/actions/public-booking";

export function PublicBookingForm({ businessSlug }: { businessSlug: string }) {
  const [pending, startTransition] = useTransition();
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");

  useEffect(() => {
    void getPublicBookingSlots(businessSlug).then((res) => {
      if (res.ok) setSlots(res.slots);
    });
  }, [businessSlug]);

  function onSubmit(fd: FormData) {
    if (!slot) {
      toast.error("Elige un horario.");
      return;
    }
    startTransition(async () => {
      const res = await createPublicBooking({
        businessSlug,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        address: String(fd.get("address") ?? ""),
        city: String(fd.get("city") ?? ""),
        zip: String(fd.get("zip") ?? ""),
        notes: String(fd.get("notes") ?? ""),
        startsAt: slot,
        durationMinutes: 60,
      });
      if (res.ok) {
        toast.success("¡Reserva enviada! El negocio te contactará.");
        setSlot("");
      } else toast.error(res.error ?? "No se pudo reservar.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar medida</CardTitle>
        <CardDescription>
          Elige un horario disponible e indica la dirección de la visita.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bk-slot">Horario</Label>
            <select
              id="bk-slot"
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              required
              disabled={pending}
            >
              <option value="">Selecciona…</option>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {new Date(s).toLocaleString("es-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
            {slots.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay slots visibles ahora. Puedes contactar por el formulario.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-name">Nombre</Label>
            <Input id="bk-name" name="name" required disabled={pending} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-phone">Teléfono</Label>
              <Input id="bk-phone" name="phone" required disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-email">Email</Label>
              <Input id="bk-email" name="email" type="email" disabled={pending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-address">Dirección de la medida</Label>
            <Input id="bk-address" name="address" required disabled={pending} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-city">Ciudad</Label>
              <Input id="bk-city" name="city" required disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-zip">ZIP</Label>
              <Input id="bk-zip" name="zip" disabled={pending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-notes">Notas</Label>
            <Textarea id="bk-notes" name="notes" rows={2} disabled={pending} />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !slot}>
            Solicitar cita
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
