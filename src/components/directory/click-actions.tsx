"use client";

import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClickInteraction } from "@/actions/bridge";

/**
 * El Puente: click-to-call y WhatsApp registran un Lead
 * con source tracking antes de abrir el enlace.
 */
export function ClickActions({
  businessId,
  phone,
  whatsapp,
}: {
  businessId: string;
  phone: string | null;
  whatsapp: string | null;
}) {
  if (!phone && !whatsapp) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {phone && (
        <Button
          asChild
          size="lg"
          className="flex-1"
          onClick={() => {
            void trackClickInteraction({ businessId, source: "CLICK_CALL" });
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
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={() => {
            void trackClickInteraction({ businessId, source: "CLICK_WHATSAPP" });
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
