"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageBadge } from "@/components/crm/stage-badge";
import { CreateDealDialog } from "@/components/crm/create-deal-dialog";
import {
  completeAppointment,
  getAppointmentDetail,
  updateAppointment,
  type AppointmentDetail,
} from "@/actions/appointments";
import { createTask, searchContacts, toggleTask } from "@/actions/crm";
import { formatMoney } from "@/lib/date-range";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  MEASURE: "Medida",
  VISIT: "Visita",
  CALL: "Llamada",
  OTHER: "Otro",
};

const TYPE_CHIP: Record<string, string> = {
  MEASURE: "border-sky-200 bg-sky-100 text-sky-900",
  VISIT: "border-emerald-200 bg-emerald-100 text-emerald-900",
  CALL: "border-amber-200 bg-amber-100 text-amber-900",
  OTHER: "border-slate-200 bg-slate-100 text-slate-800",
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programada",
  DONE: "Completada",
  CANCELED: "Cancelada",
};

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

function formatAddress(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  return [parts.address, parts.city, parts.state, parts.zip]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hace 1 día";
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-US", { dateStyle: "medium" });
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseLocalDateTime(date: string, time: string): Date | null {
  const d = date.trim();
  const t = time.trim();
  if (!d || !t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const value = new Date(
    `${d}T${m[1].padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}`,
  );
  return Number.isNaN(value.getTime()) ? null : value;
}

type ContactHit = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function AppointmentDetailSheet({
  appointmentId,
  open,
  onOpenChange,
  seed,
  onDetail,
  onStatusChange,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed?: AppointmentDetail | null;
  onDetail?: (detail: AppointmentDetail) => void;
  onStatusChange?: (id: string, status: AppointmentDetail["status"]) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQ, setLinkQ] = useState("");
  const [linkHits, setLinkHits] = useState<ContactHit[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    if (!open || !appointmentId) {
      setDetail(null);
      setError(null);
      setNotes("");
      return;
    }
    let cancelled = false;
    const cached = seed?.id === appointmentId ? seed : null;
    if (cached) {
      setDetail(cached);
      setNotes(cached.notes ?? "");
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
      setNotes("");
    }
    void getAppointmentDetail({ id: appointmentId }).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        if (!cached) {
          setError(res.error);
          setDetail(null);
        }
      } else {
        setDetail(res.appointment);
        setNotes((prev) =>
          cached && prev !== (cached.notes ?? "")
            ? prev
            : (res.appointment.notes ?? ""),
        );
        onDetail?.(res.appointment);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // seed only used as initial cache on open; omit from deps to avoid note reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  useEffect(() => {
    if (!detail?.id) return;
    if (notes === (detail.notes ?? "")) return;
    const id = detail.id;
    const snapshot = detail;
    const t = window.setTimeout(() => {
      setSaveState("saving");
      void updateAppointment({
        id,
        notes,
        syncCalendar: false,
      }).then((res) => {
        if (!res.ok) {
          toast.error(res.error ?? "No se pudo guardar la nota.");
          setSaveState("idle");
          return;
        }
        const next = { ...snapshot, notes };
        setDetail(next);
        onDetail?.(next);
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1600);
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [notes, detail?.id, detail?.notes]);

  useEffect(() => {
    if (!detail?.id || typeof window === "undefined") return;
    setHistoryOpen(window.matchMedia("(min-width: 768px)").matches);
  }, [detail?.id]);

  const typeLabel = detail
    ? (TYPE_LABEL[detail.type] ?? detail.type)
    : "";
  const phone = detail?.contact?.phone?.trim() || null;
  const email = detail?.contact?.email?.trim() || null;
  const contactAddress = detail?.contact
    ? formatAddress(detail.contact)
    : "";
  const visitAddress = detail
    ? formatAddress({
        address: detail.address,
        city: detail.city,
        state: detail.state,
        zip: detail.zip,
      })
    : "";

  const waHref = useMemo(() => {
    if (!phone || !detail) return null;
    const name = detail.contact?.name ?? "";
    return whatsappUrl(
      phone,
      `Hola${name ? ` ${name}` : ""}, te contacto sobre tu cita de ${typeLabel.toLowerCase()}.`,
    );
  }, [phone, detail, typeLabel]);

  async function reload() {
    if (!appointmentId) return;
    const res = await getAppointmentDetail({ id: appointmentId });
    if (res.ok) {
      setDetail(res.appointment);
      setNotes(res.appointment.notes ?? "");
      onDetail?.(res.appointment);
    }
  }

  function applyStatus(status: AppointmentDetail["status"]) {
    if (!detail) return;
    onStatusChange?.(detail.id, status);
    const next = { ...detail, status };
    setDetail(next);
    onDetail?.(next);
    router.refresh();
  }

  function linkContact(contactId: string) {
    if (!detail) return;
    startTransition(async () => {
      const res = await updateAppointment({
        id: detail.id,
        contactId,
        syncCalendar: false,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo vincular.");
        return;
      }
      toast.success("Contacto vinculado.");
      setLinkOpen(false);
      await reload();
    });
  }

  function onSearchContacts(q: string) {
    setLinkQ(q);
    startTransition(async () => {
      const res = await searchContacts({ q });
      if (res.ok) setLinkHits(res.contacts);
    });
  }

  function markDone() {
    if (!detail) return;
    startTransition(async () => {
      const res = await completeAppointment({
        id: detail.id,
        outcome: outcome.trim() || undefined,
        followUpTitle:
          followUp && followUpTitle.trim() ? followUpTitle.trim() : undefined,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo completar.");
        return;
      }
      toast.success("Cita completada.");
      setCompleteOpen(false);
      setOutcome("");
      setFollowUp(false);
      applyStatus("DONE");
      await reload();
    });
  }

  function reopen() {
    if (!detail) return;
    startTransition(async () => {
      const res = await updateAppointment({ id: detail.id, status: "SCHEDULED" });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo reabrir.");
        return;
      }
      toast.success("Cita reabierta.");
      applyStatus("SCHEDULED");
    });
  }

  function cancelAppt() {
    if (!detail) return;
    startTransition(async () => {
      const res = await updateAppointment({ id: detail.id, status: "CANCELED" });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo cancelar.");
        return;
      }
      toast.success("Cita cancelada.");
      applyStatus("CANCELED");
      onOpenChange(false);
    });
  }

  function saveReschedule() {
    if (!detail) return;
    const startsAt = parseLocalDateTime(rescheduleDate, rescheduleTime);
    if (!startsAt) {
      toast.error("Revisa fecha y hora.");
      return;
    }
    const duration =
      new Date(detail.endsAt).getTime() - new Date(detail.startsAt).getTime();
    const endsAt = new Date(startsAt.getTime() + Math.max(duration, 15 * 60_000));
    startTransition(async () => {
      const res = await updateAppointment({
        id: detail.id,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: "SCHEDULED",
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo reagendar.");
        return;
      }
      toast.success("Cita reagendada.");
      setRescheduleOpen(false);
      applyStatus("SCHEDULED");
      await reload();
      router.refresh();
    });
  }

  function addTask() {
    if (!detail?.deal || !newTaskTitle.trim()) return;
    startTransition(async () => {
      const res = await createTask({
        title: newTaskTitle.trim(),
        dealId: detail.deal!.id,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo crear la tarea.");
        return;
      }
      setNewTaskTitle("");
      toast.success("Tarea creada.");
      await reload();
      router.refresh();
    });
  }

  function toggleDealTask(taskId: string) {
    startTransition(async () => {
      const res = await toggleTask({ taskId });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo actualizar.");
        return;
      }
      await reload();
      router.refresh();
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto sm:max-w-md"
        >
          {loading && (
            <div className="space-y-3 px-1 pt-2">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!loading && error && (
            <p className="px-1 pt-4 text-sm text-destructive">{error}</p>
          )}

          {!loading && detail && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8 text-left">{detail.title}</SheetTitle>
                <SheetDescription className="text-left">
                  {typeLabel} ·{" "}
                  {new Date(detail.startsAt).toLocaleString("es-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-6 px-1 pb-8">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("border", TYPE_CHIP[detail.type])}
                  >
                    {typeLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      detail.status === "DONE" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-800",
                      detail.status === "CANCELED" &&
                        "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    {STATUS_LABEL[detail.status] ?? detail.status}
                  </Badge>
                  {detail.googleEventId && (
                    <Badge variant="outline">Google Calendar</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {phone && (
                    <Button asChild className="h-11 min-h-11" size="sm">
                      <a href={`tel:${phone}`} aria-label="Llamar">
                        <Phone className="size-4" />
                        Llamar
                      </a>
                    </Button>
                  )}
                  {waHref && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 min-h-11"
                      size="sm"
                    >
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {detail.mapsUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 min-h-11"
                      size="sm"
                    >
                      <a
                        href={detail.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Abrir Maps"
                      >
                        Maps <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </div>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Cliente</h3>
                  {detail.contact ? (
                    <div className="space-y-1.5 rounded-lg border p-3 text-sm">
                      <Link
                        href={`/app/contactos?contact=${detail.contact.id}`}
                        className="font-medium text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {detail.contact.name}
                      </Link>
                      {detail.contact.company && (
                        <p className="text-muted-foreground">
                          {detail.contact.company}
                        </p>
                      )}
                      {phone && (
                        <p>
                          <a href={`tel:${phone}`} className="hover:underline">
                            {phone}
                          </a>
                        </p>
                      )}
                      {email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <a href={`mailto:${email}`} className="hover:underline">
                            {email}
                          </a>
                        </p>
                      )}
                      {(contactAddress || visitAddress) && (
                        <p className="flex items-start gap-1.5 text-muted-foreground">
                          <MapPin className="mt-0.5 size-3.5 shrink-0" />
                          {contactAddress || visitAddress}
                        </p>
                      )}
                      {detail.contact.notes && (
                        <p className="whitespace-pre-wrap border-t pt-2 text-muted-foreground">
                          {detail.contact.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-lg border border-dashed p-3">
                      <p className="text-sm text-muted-foreground">
                        Esta cita no tiene contacto vinculado.
                      </p>
                      {!linkOpen ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setLinkOpen(true);
                            onSearchContacts("");
                          }}
                        >
                          Vincular un contacto
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={linkQ}
                              onChange={(e) => onSearchContacts(e.target.value)}
                              placeholder="Buscar por nombre o teléfono"
                              className="pl-8"
                              autoFocus
                            />
                          </div>
                          <ul className="max-h-40 space-y-1 overflow-y-auto">
                            {linkHits.map((c) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() => linkContact(c.id)}
                                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                                >
                                  <span className="font-medium">{c.name}</span>
                                  {c.phone && (
                                    <span className="ml-2 text-muted-foreground">
                                      {c.phone}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                            {linkHits.length === 0 && (
                              <li className="px-2 py-1 text-xs text-muted-foreground">
                                Sin resultados.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Proyecto</h3>
                  {detail.deal ? (
                    <div className="space-y-2 rounded-lg border p-3 text-sm">
                      <Link
                        href={`/app/deals?deal=${detail.deal.id}`}
                        className="flex items-center justify-between gap-2 font-medium text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        <span className="truncate">{detail.deal.title}</span>
                        <ChevronRight className="size-4 shrink-0" />
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <StageBadge stage={detail.deal.stage} />
                        <span className="text-muted-foreground">
                          {detail.deal.value != null
                            ? formatMoney(detail.deal.value)
                            : "Sin valor"}
                        </span>
                      </div>
                      {detail.deal.notes && (
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {detail.deal.notes}
                        </p>
                      )}
                    </div>
                  ) : detail.contact ? (
                    <div className="rounded-lg border border-dashed p-3">
                      <p className="mb-2 text-sm text-muted-foreground">
                        Sin proyecto (deal) ligado a esta visita.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setDealOpen(true)}
                      >
                        Crear proyecto desde esta visita
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vincula un contacto para crear un proyecto.
                    </p>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Notas de la visita</h3>
                    <span className="text-xs text-muted-foreground">
                      {saveState === "saving" && "Guardando…"}
                      {saveState === "saved" && "Guardado"}
                    </span>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Detalles de la visita, medidas, preferencias del cliente…"
                  />
                </section>

                {detail.deal && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Tareas pendientes</h3>
                    {detail.deal.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay tareas abiertas.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {detail.deal.tasks.map((task) => (
                          <li key={task.id}>
                            <label className="flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
                              <input
                                type="checkbox"
                                className="mt-1 size-4"
                                disabled={pending}
                                onChange={() => toggleDealTask(task.id)}
                              />
                              <span>
                                {task.title}
                                {task.dueDate && (
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {new Date(task.dueDate).toLocaleDateString(
                                      "es-US",
                                      { dateStyle: "medium" },
                                    )}
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Agregar tarea"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTask();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending || !newTaskTitle.trim()}
                        onClick={addTask}
                      >
                        Agregar
                      </Button>
                    </div>
                  </section>
                )}

                {detail.deal && detail.deal.activities.length > 0 && (
                  <section className="space-y-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-sm font-semibold"
                      onClick={() => setHistoryOpen((v) => !v)}
                      aria-expanded={historyOpen}
                    >
                      Historial
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          historyOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {historyOpen && (
                      <ul className="space-y-2 border-l pl-3 text-sm">
                        {detail.deal.activities.map((a) => (
                          <li key={a.id}>
                            <p className="whitespace-pre-wrap">{a.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {relativeTime(a.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                <section className="space-y-2 border-t pt-4">
                  {detail.status === "SCHEDULED" && (
                    <>
                      <Button
                        type="button"
                        className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={pending}
                        onClick={() => {
                          setFollowUpTitle(
                            detail.contact
                              ? `Seguimiento — ${detail.contact.name}`
                              : "Seguimiento de visita",
                          );
                          setCompleteOpen(true);
                        }}
                      >
                        <CheckSquare className="size-4" />
                        Marcar completada
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full"
                        disabled={pending}
                        onClick={() => {
                          setRescheduleDate(toDateInput(detail.startsAt));
                          setRescheduleTime(toTimeInput(detail.startsAt));
                          setRescheduleOpen(true);
                        }}
                      >
                        Reagendar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-full text-destructive hover:text-destructive"
                        disabled={pending}
                        onClick={cancelAppt}
                      >
                        Cancelar cita
                      </Button>
                    </>
                  )}
                  {detail.status === "DONE" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full"
                      disabled={pending}
                      onClick={reopen}
                    >
                      Reabrir
                    </Button>
                  )}
                  {detail.status === "CANCELED" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full"
                      disabled={pending}
                      onClick={() => {
                        setRescheduleDate(toDateInput(detail.startsAt));
                        setRescheduleTime(toTimeInput(detail.startsAt));
                        setRescheduleOpen(true);
                      }}
                    >
                      Reagendar
                    </Button>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar visita completada</DialogTitle>
            <DialogDescription>
              Qué pasó en la visita. Se guarda en el historial del proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="visit-outcome">Resultado (opcional)</Label>
              <Textarea
                id="visit-outcome"
                rows={3}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Medidas tomadas, siguiente paso, preferencias…"
              />
            </div>
            {detail?.deal && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={followUp}
                  onChange={(e) => setFollowUp(e.target.checked)}
                />
                <span>
                  Crear tarea de seguimiento
                  {followUp && (
                    <Input
                      className="mt-2"
                      value={followUpTitle}
                      onChange={(e) => setFollowUpTitle(e.target.value)}
                      placeholder="Título de la tarea"
                    />
                  )}
                </span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompleteOpen(false)}
            >
              Volver
            </Button>
            <Button type="button" disabled={pending} onClick={markDone}>
              {pending ? "Guardando…" : "Completar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar cita</DialogTitle>
            <DialogDescription>
              Se mantiene la duración original.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rs-date">Fecha</Label>
              <Input
                id="rs-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-time">Hora</Label>
              <Input
                id="rs-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
            >
              Volver
            </Button>
            <Button type="button" disabled={pending} onClick={saveReschedule}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detail?.contact && (
        <CreateDealDialog
          contactId={detail.contact.id}
          contactName={detail.contact.name}
          open={dealOpen}
          onOpenChange={setDealOpen}
          showTrigger={false}
          navigateToDeal={false}
          onSuccess={(dealId) => {
            if (!detail) return;
            startTransition(async () => {
              const res = await updateAppointment({
                id: detail.id,
                dealId,
                syncCalendar: false,
              });
              if (!res.ok) {
                toast.error(res.error ?? "Deal creado, pero no se ligó a la cita.");
                return;
              }
              await reload();
              router.refresh();
            });
          }}
        />
      )}
    </>
  );
}
