"use client";

import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateLeadStatus, convertLead } from "@/actions/crm";
import { ScheduleAppointmentDialog } from "@/components/crm/schedule-appointment-dialog";
import type { LeadStatus } from "@prisma/client";

const statuses: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "Nuevo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "QUALIFIED", label: "Calificado" },
];

export function LeadRowActions({
  leadId,
  leadName,
  status,
}: {
  leadId: string;
  leadName: string;
  status: LeadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [convertOpen, setConvertOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  function runStatus(next: LeadStatus) {
    startTransition(async () => {
      const res = await updateLeadStatus({ leadId, status: next });
      if (!res.ok) toast.error(res.error);
      else toast.success("Estado actualizado.");
    });
  }

  function runConvert() {
    startTransition(async () => {
      const res = await convertLead({ leadId });
      if (res.ok) {
        toast.success("Lead convertido en contacto + deal.");
        setConvertOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
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
              <DropdownMenuItem key={s.value} onClick={() => runStatus(s.value)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          {status !== "LOST" && status !== "CONVERTED" && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => runStatus("LOST")}
            >
              Marcar perdido
            </DropdownMenuItem>
          )}
          {status !== "CONVERTED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConvertOpen(true)}>
                Convertir…
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setScheduleOpen(true)}>
            Agendar cita…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleAppointmentDialog
        defaultTitle={`Medida — ${leadName}`}
        leadId={leadId}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        showTrigger={false}
      />

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convertir lead</DialogTitle>
            <DialogDescription>
              Se creará un Contacto y un Deal en etapa <strong>Nuevo</strong> con
              título &ldquo;Solicitud de {leadName}&rdquo;. El lead quedará como
              Convertido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConvertOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={runConvert} disabled={pending}>
              {pending ? "Convirtiendo…" : "Convertir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
