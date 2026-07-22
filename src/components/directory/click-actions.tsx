"use client";

import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackContactClick } from "@/actions/bridge";
import { cn } from "@/lib/utils";

/**
 * El Puente: click-to-call y WhatsApp registran un Lead
 * con source tracking ANTES de abrir el enlace.
 */
export function ClickActions({
  businessSlug,
  phone,
  whatsapp,
  className,
  compact,
}: {
  businessSlug: string;
  phone: string | null;
  whatsapp: string | null;
  className?: string;
  /** Smaller padding for sticky mobile bar */
  compact?: boolean;
}) {
  if (!phone && !whatsapp) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row",
        compact && "flex-row gap-2",
        className,
      )}
    >
      {phone && (
        <Button
          asChild
          size={compact ? "default" : "lg"}
          className="flex-1"
          onClick={() => {
            void trackContactClick(businessSlug, "CLICK_CALL");
          }}
        >
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
            <Phone className="size-4" /> Llamar
          </a>
        </Button>
      )}
      {whatsapp && (
        <Button
          asChild
          size={compact ? "default" : "lg"}
          variant="secondary"
          className="flex-1"
          onClick={() => {
            void trackContactClick(businessSlug, "CLICK_WHATSAPP");
          }}
        >
          <a
            href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </Button>
      )}
    </div>
  );
}
