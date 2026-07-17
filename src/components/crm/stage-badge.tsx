import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DealStage, LeadSource, LeadStatus } from "@prisma/client";

const stageStyles: Record<DealStage, string> = {
  NUEVO: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  CONTACTADO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  COTIZADO: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  NEGOCIACION: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  GANADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PERDIDO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const stageLabels: Record<DealStage, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
  NEGOCIACION: "Negociación",
  GANADO: "Ganado",
  PERDIDO: "Perdido",
};

export function StageBadge({ stage }: { stage: DealStage }) {
  return (
    <Badge variant="secondary" className={cn("border-0", stageStyles[stage])}>
      {stageLabels[stage]}
    </Badge>
  );
}

const statusStyles: Record<LeadStatus, string> = {
  NEW: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  CONTACTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  QUALIFIED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CONVERTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  LOST: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0", statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export const leadSourceLabels: Record<LeadSource, string> = {
  DIRECTORY_FORM: "Formulario",
  QUOTE_REQUEST: "Cotización",
  CLICK_CALL: "Llamada",
  CLICK_WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
  IMPORT: "Importado",
  REFERRAL: "Referido",
};

const sourceStyles: Record<LeadSource, string> = {
  DIRECTORY_FORM: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  QUOTE_REQUEST: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  CLICK_CALL: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CLICK_WHATSAPP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  MANUAL: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  IMPORT: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  REFERRAL: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
};

export function LeadSourceBadge({ source }: { source: LeadSource }) {
  return (
    <Badge variant="secondary" className={cn("border-0", sourceStyles[source])}>
      {leadSourceLabels[source]}
    </Badge>
  );
}

export { statusLabels as leadStatusLabels };
