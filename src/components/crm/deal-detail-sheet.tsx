"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Phone, StickyNote, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StageBadge } from "@/components/crm/stage-badge";
import {
  addDealActivity,
  createTask,
  toggleTask,
  updateDeal,
} from "@/actions/crm";
import { ScheduleAppointmentDialog } from "@/components/crm/schedule-appointment-dialog";
import type { DealCardData } from "@/lib/deals";
import { formatMoney } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
}: {
  deal: DealCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  if (!deal) return null;

  function saveField(field: "title" | "value" | "notes", value: string) {
    startTransition(async () => {
      const res = await updateDeal({
        dealId: deal!.id,
        [field]: field === "value" ? (value === "" ? null : value) : value,
      });
      if (!res.ok) toast.error(res.error);
    });
  }

  function addActivity(type: "note" | "call") {
    if (!note.trim()) {
      toast.error("Escribe el contenido.");
      return;
    }
    startTransition(async () => {
      const res = await addDealActivity({
        dealId: deal!.id,
        type,
        content: note.trim(),
      });
      if (res.ok) {
        setNote("");
        toast.success(type === "call" ? "Llamada registrada." : "Nota agregada.");
      } else toast.error(res.error);
    });
  }

  function addTask() {
    if (!taskTitle.trim()) return;
    startTransition(async () => {
      const res = await createTask({
        title: taskTitle.trim(),
        dealId: deal!.id,
      });
      if (res.ok) {
        setTaskTitle("");
        toast.success("Tarea creada.");
      } else toast.error(res.error);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 pr-6">
            <StageBadge stage={deal.stage} />
            <span className="text-xs text-muted-foreground">
              {deal.daysInStage}d en etapa
            </span>
          </div>
          <SheetTitle className="text-left">
            <Input
              defaultValue={deal.title}
              className="h-auto border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              onBlur={(e) => {
                if (e.target.value !== deal.title) {
                  saveField("title", e.target.value);
                }
              }}
            />
          </SheetTitle>
          <SheetDescription className="text-left">
            {deal.contact?.name ?? "Sin contacto"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <ScheduleAppointmentDialog
            defaultTitle={`Medida — ${deal.contact?.name ?? deal.title}`}
            dealId={deal.id}
            contactId={deal.contact?.id}
            triggerLabel="Agendar medida / visita"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Valor ($)</Label>
              <Input
                type="number"
                defaultValue={deal.value ?? ""}
                placeholder="0"
                onBlur={(e) => saveField("value", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor actual</Label>
              <p className="flex h-9 items-center text-sm font-medium">
                {deal.value != null ? formatMoney(deal.value) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas del deal</Label>
            <Textarea
              defaultValue={deal.notes ?? ""}
              rows={3}
              placeholder="Notas internas..."
              onBlur={(e) => {
                if (e.target.value !== (deal.notes ?? "")) {
                  saveField("notes", e.target.value);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Agregar nota / llamada</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Escribe una nota o resumen de llamada..."
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => addActivity("note")}
              >
                <StickyNote className="size-4" /> Nota
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => addActivity("call")}
              >
                <Phone className="size-4" /> Llamada
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timeline</Label>
            {deal.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad aún.</p>
            ) : (
              <ul className="space-y-3 border-l-2 border-muted pl-4">
                {deal.activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary" />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {a.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("es-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tareas del deal</Label>
            <div className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Nueva tarea..."
              />
              <Button
                type="button"
                size="icon"
                disabled={pending}
                onClick={addTask}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <ul className="divide-y rounded-lg border">
              {deal.tasks.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Sin tareas
                </li>
              ) : (
                deal.tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={pending}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                      onClick={() =>
                        startTransition(async () => {
                          await toggleTask({ taskId: t.id });
                        })
                      }
                    >
                      <span
                        className={cn(
                          "size-4 rounded border",
                          t.done && "bg-primary border-primary",
                        )}
                      />
                      <span className={cn(t.done && "line-through opacity-60")}>
                        {t.title}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
