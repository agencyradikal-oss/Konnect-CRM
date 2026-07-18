import type { DealStage } from "@prisma/client";

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "NUEVO", label: "Nuevo" },
  { id: "CONTACTADO", label: "Contactado" },
  { id: "COTIZADO", label: "Cotizado" },
  { id: "NEGOCIACION", label: "Negociación" },
  { id: "GANADO", label: "Ganado" },
  { id: "PERDIDO", label: "Perdido" },
];

export type DealCardData = {
  id: string;
  title: string;
  stage: DealStage;
  value: number | null;
  notes: string | null;
  expectedClose: string | null;
  updatedAt: string;
  createdAt: string;
  daysInStage: number;
  contact: { id: string; name: string } | null;
  activities: {
    id: string;
    type: string;
    content: string;
    createdAt: string;
  }[];
  tasks: {
    id: string;
    title: string;
    done: boolean;
    dueDate: string | null;
  }[];
};

export function daysBetween(from: Date, to = new Date()): number {
  const ms = startOfDayMs(to) - startOfDayMs(from);
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function startOfDayMs(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
