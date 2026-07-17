"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfile } from "@/actions/business";

type ProfileData = {
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  zip: string;
};

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    startTransition(async () => {
      try {
        const res = await updateBusinessProfile(data);
        if (res.ok) toast.success("Perfil actualizado.");
        else toast.error("No se pudo guardar.");
      } catch {
        toast.error("Revisa los campos e intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={initial.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={initial.whatsapp} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email público</Label>
          <Input id="email" name="email" type="email" defaultValue={initial.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            name="website"
            placeholder="https://..."
            defaultValue={initial.website}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" defaultValue={initial.address} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">Código postal</Label>
          <Input id="zip" name="zip" defaultValue={initial.zip} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ciudad</Label>
        <Input id="city" name="city" defaultValue={initial.city} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
