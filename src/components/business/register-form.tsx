"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { registerBusiness } from "@/actions/business";

type CategoryOption = { id: string; nameEs: string };

export function RegisterBusinessForm({ categories }: { categories: CategoryOption[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    startTransition(async () => {
      try {
        const res = await registerBusiness(data);
        if (res.ok) {
          toast.success("¡Negocio registrado! Está pendiente de aprobación.");
          router.push("/app/dashboard");
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Revisa los campos e intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del negocio *</Label>
        <Input id="name" name="name" required placeholder="Ej: Granitos El Águila" />
      </div>

      <div className="space-y-2">
        <Label>Categoría *</Label>
        <Select name="categoryId" required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nameEs}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad *</Label>
          <Input id="city" name="city" required placeholder="Ej: Norcross" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="(770) 555-0100" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp (con código de país)</Label>
        <Input id="whatsapp" name="whatsapp" placeholder="17705550100" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción del negocio</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Cuéntale a tus clientes qué haces, tu experiencia y por qué elegirte..."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Registrando..." : "Publicar mi negocio"}
      </Button>
    </form>
  );
}
