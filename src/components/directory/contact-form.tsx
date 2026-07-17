"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createLeadFromDirectory } from "@/actions/bridge";
import type { LeadSource } from "@prisma/client";

type FormSource = Extract<LeadSource, "DIRECTORY_FORM" | "QUOTE_REQUEST">;

function ContactDialog({
  businessSlug,
  source,
  trigger,
  title,
  description,
  submitLabel,
}: {
  businessSlug: string;
  source: FormSource;
  trigger: React.ReactNode;
  title: string;
  description: string;
  submitLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isQuote = source === "QUOTE_REQUEST";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await createLeadFromDirectory(businessSlug, data, source);
        if (res.ok) {
          toast.success(
            isQuote
              ? "¡Cotización enviada! El negocio te contactará pronto."
              : "¡Mensaje enviado! El negocio te contactará pronto.",
          );
          form.reset();
          setOpen(false);
        } else {
          toast.error(res.error ?? "No se pudo enviar.");
        }
      } catch {
        toast.error("Revisa los campos e intenta de nuevo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${source}`}>Nombre *</Label>
            <Input
              id={`name-${source}`}
              name="name"
              required
              placeholder="Tu nombre"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`phone-${source}`}>Teléfono</Label>
              <Input
                id={`phone-${source}`}
                name="phone"
                type="tel"
                placeholder="(404) 555-0100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${source}`}>Email</Label>
              <Input
                id={`email-${source}`}
                name="email"
                type="email"
                placeholder="tu@email.com"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Indica al menos un teléfono o email.
          </p>
          <div className="space-y-2">
            <Label htmlFor={`message-${source}`}>
              {isQuote ? "¿Qué necesitas cotizar?" : "Mensaje"}
            </Label>
            <Textarea
              id={`message-${source}`}
              name="message"
              rows={4}
              placeholder={
                isQuote
                  ? "Describe el trabajo o servicio que necesitas..."
                  : "Escribe tu mensaje..."
              }
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enviando..." : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContactForm({ businessSlug }: { businessSlug: string }) {
  return (
    <div className="flex flex-col gap-2">
      <ContactDialog
        businessSlug={businessSlug}
        source="DIRECTORY_FORM"
        title="Enviar mensaje"
        description="Tu mensaje se registra como lead en el CRM del negocio."
        submitLabel="Enviar mensaje"
        trigger={
          <Button className="w-full" size="lg">
            <MessageSquare className="size-4" /> Enviar mensaje
          </Button>
        }
      />
      <ContactDialog
        businessSlug={businessSlug}
        source="QUOTE_REQUEST"
        title="Solicitar cotización"
        description="Describe lo que necesitas y el negocio te responderá."
        submitLabel="Pedir cotización"
        trigger={
          <Button className="w-full" size="lg" variant="secondary">
            <FileText className="size-4" /> Solicitar cotización
          </Button>
        }
      />
    </div>
  );
}
