import type { TaskStatus } from "@prisma/client";

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "Por hacer" },
  { id: "IN_PROGRESS", label: "En curso" },
  { id: "DONE", label: "Hechas" },
];

export type BusinessMember = {
  id: string;
  name: string | null;
  email: string;
};

export type TaskCardData = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  dealId: string | null;
  assigneeId: string | null;
  assignee: BusinessMember | null;
  createdAt: string;
};

export function isTaskDone(status: TaskStatus): boolean {
  return status === "DONE";
}

export function memberLabel(member: BusinessMember | null | undefined): string {
  if (!member) return "Sin asignar";
  const name = member.name?.trim();
  return name || member.email;
}
