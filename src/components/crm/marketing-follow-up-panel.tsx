"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Phone } from "lucide-react";
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
import { logOutreach, sendFollowUpEmail } from "@/actions/marketing";
import {
  getTemplate,
  renderTemplate,
  type MarketingTemplate,
} from "@/lib/marketing/templates";

export type MarketingRecipient = {
  kind: "lead" | "contact";
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dealId: string | null;
};

export function recipientKey(r: Pick<MarketingRecipient, "kind" | "id">) {
  return `${r.kind}:${r.id}`;
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function whatsappUrl(phone: string, text: string): string {
  const digits = digitsOnly(phone);
  const q = encodeURIComponent(text);
  return digits
    ? `https://wa.me/${digits}?text=${q}`
    : `https://wa.me/?text=${q}`;
}

function smsUrl(phone: string, text: string): string {
  const digits = digitsOnly(phone);
  const q = encodeURIComponent(text);
  // iOS usa &body=; Android suele aceptar ?body=
  return digits ? `sms:${digits}?body=${q}` : `sms:?body=${q}`;
}

export function MarketingFollowUpPanel({
  recipients,
  templates,
  businessName,
  emailsUsed,
  emailsLimit,
  prefillKey,
}: {
  recipients: MarketingRecipient[];
  templates: MarketingTemplate[];
  businessName: string;
  emailsUsed: number;
  emailsLimit: number;
  prefillKey?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [recipientKeyState, setRecipientKeyState] = useState(
    () =>
      prefillKey && recipients.some((r) => recipientKey(r) === prefillKey)
        ? prefillKey
        : recipients[0]
          ? recipientKey(recipients[0])
          : "",
  );
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.includes(q),
    );
  }, [recipients, query]);

  const recipient =
    recipients.find((r) => recipientKey(r) === recipientKeyState) ?? null;
  const template = getTemplate(templateKey) ?? templates[0];
  const preview = template
    ? renderTemplate(template, {
        nombre: recipient?.name ?? "cliente",
        negocio: businessName,
      })
    : { subject: "", body: "" };

  const remaining = Math.max(0, emailsLimit - emailsUsed);

  function openChannel(channel: "whatsapp" | "sms") {
    if (!recipient || !template) {
      toast.error("Elige un destinatario y una plantilla.");
      return;
    }
    if (!recipient.phone) {
      toast.error("Este contacto no tiene teléfono.");
      return;
    }
    const url =
      channel === "whatsapp"
        ? whatsappUrl(recipient.phone, preview.body)
        : smsUrl(recipient.phone, preview.body);
    window.open(url, "_blank", "noopener,noreferrer");

    startTransition(async () => {
      const res = await logOutreach({
        channel,
        templateKey: template.key,
        contactId: recipient.kind === "contact" ? recipient.id : null,
        leadId: recipient.kind === "lead" ? recipient.id : null,
        dealId: recipient.dealId,
        toValue: recipient.phone,
      });
      if (res.ok) toast.success("Seguimiento registrado.");
      else toast.error(res.error ?? "No se pudo registrar.");
    });
  }

  function sendEmail() {
    if (!recipient || !template) {
      toast.error("Elige un destinatario y una plantilla.");
      return;
    }
    if (!recipient.email) {
      toast.error("Este contacto no tiene email.");
      return;
    }

    startTransition(async () => {
      const res = await sendFollowUpEmail({
        templateKey: template.key,
        contactId: recipient.kind === "contact" ? recipient.id : null,
        leadId: recipient.kind === "lead" ? recipient.id : null,
        toEmail: recipient.email!,
        recipientName: recipient.name,
      });
      if (res.ok) toast.success(`Email enviado. Quedan ${res.remaining} este mes.`);
      else toast.error(res.error ?? "No se pudo enviar.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguimiento 1:1</CardTitle>
        <CardDescription>
          Plantillas para WhatsApp, SMS o email. El email cuenta contra tu cupo
          mensual ({emailsUsed}/{emailsLimit}). Confirma que tienes relación con
          el destinatario antes de enviar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{remaining} emails restantes</Badge>
          <Badge variant="outline">{templates.length} plantillas</Badge>
        </div>

        {recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay leads ni contactos con email o teléfono.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="mkt-search">Buscar destinatario</Label>
              <Input
                id="mkt-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre, email o teléfono"
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Destinatario</Label>
              <Select
                value={recipientKeyState}
                onValueChange={setRecipientKeyState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegir…" />
                </SelectTrigger>
                <SelectContent>
                  {filtered.map((r) => (
                    <SelectItem key={recipientKey(r)} value={recipientKey(r)}>
                      {r.name}
                      {r.kind === "lead" ? " (lead)" : ""}
                      {!r.email && !r.phone
                        ? ""
                        : ` · ${[r.email, r.phone].filter(Boolean).join(" · ")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Plantilla</Label>
              <Select value={templateKey} onValueChange={setTemplateKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vista previa</Label>
              <Input value={preview.subject} readOnly className="font-medium" />
              <Textarea value={preview.body} readOnly rows={7} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending || !recipient?.phone}
                onClick={() => openChannel("whatsapp")}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || !recipient?.phone}
                onClick={() => openChannel("sms")}
              >
                <Phone className="size-4" />
                SMS
              </Button>
              <Button
                type="button"
                disabled={pending || !recipient?.email || remaining <= 0}
                onClick={sendEmail}
              >
                <Mail className="size-4" />
                Enviar email
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
