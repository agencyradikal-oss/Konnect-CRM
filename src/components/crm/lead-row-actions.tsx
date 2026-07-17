"use client";

import { useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateLeadStatus, convertLead } from "@/actions/crm";
import type { LeadStatus } from "@prisma/client";

const statuses: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "Nuevo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "QUALIFIED", label: "Calificado" },
  { value: "LOST", label: "Perdido" },
];

export function LeadRowActions({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
        {statuses
          .filter((s) => s.value !== status)
          .map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() =>
                startTransition(async () => {
                  const res = await updateLeadStatus({ leadId, status: s.value });
                  if (!res.ok) toast.error(res.error);
                })
              }
            >
              {s.label}
            </DropdownMenuItem>
          ))}
        {status !== "CONVERTED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                startTransition(async () => {
                  const res = await convertLead({ leadId });
                  if (res.ok) toast.success("Lead convertido en contacto + deal.");
                  else toast.error(res.error);
                })
              }
            >
              Convertir en deal
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
