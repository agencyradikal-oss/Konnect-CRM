"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createLeadFromForm } from "@/actions/bridge";

export function ContactForm({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState<"DIRECTORY_FORM" | "QUOTE_REQUEST">(
    "DIRECTORY_FORM"
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await createLeadFromForm({ ...data, businessId, source });
        if (res.ok) {
          toast.success("¡Mensaje enviado! El negocio te contactará pronto.");
          form.reset();
        } else {
          toast.error(res.error ?? "No se pudo enviar el mensaje.");
        }
      } catch {
        toast.error("Revisa los campos e intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs
        value={source}
        onValueChange={(v) => setSource(v as typeof source)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="DIRECTORY_FORM" className="flex-1">
            Mensaje
          </TabsTrigger>
          <TabsTrigger value="QUOTE_REQUEST" className="flex-1">
            Cotización
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" required placeholder="Tu nombre" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" placeholder="(404) 555-0100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="tu@email.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">
          {source === "QUOTE_REQUEST" ? "¿Qué necesitas cotizar? *" : "Mensaje *"}
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder={
            source === "QUOTE_REQUEST"
              ? "Describe el trabajo o servicio que necesitas..."
              : "Escribe tu mensaje..."
          }
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Enviando..."
          : source === "QUOTE_REQUEST"
            ? "Pedir cotización"
            : "Enviar mensaje"}
      </Button>
    </form>
  );
}
