"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  CheckSquare,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cancelAppointment } from "@/actions/appointments";
import { toggleTask } from "@/actions/crm";
import { endOfDay, startOfDay, startOfWeek } from "@/lib/date-range";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type AgendaAppointment = {
  kind: "appointment";
  id: string;
  title: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  address: string | null;
  city: string | null;
  mapsUrl: string | null;
  googleEventId: string | null;
};

export type AgendaTask = {
  kind: "task";
  id: string;
  title: string;
  done: boolean;
  dueDate: string;
};

export type AgendaItem = AgendaAppointment | AgendaTask;

type ViewMode = "month" | "week" | "day";

type FilterKey = "MEASURE" | "VISIT" | "CALL" | "OTHER" | "TASK";

const TYPE_LABEL: Record<string, string> = {
  MEASURE: "Medida",
  VISIT: "Visita",
  CALL: "Llamada",
  OTHER: "Otro",
  TASK: "Tarea",
};

const TYPE_CHIP: Record<string, string> = {
  MEASURE: "border-sky-200 bg-sky-100 text-sky-900",
  VISIT: "border-emerald-200 bg-emerald-100 text-emerald-900",
  CALL: "border-amber-200 bg-amber-100 text-amber-900",
  OTHER: "border-slate-200 bg-slate-100 text-slate-800",
  TASK: "border-rose-200 bg-rose-100 text-rose-900",
};

const FILTERS: FilterKey[] = ["MEASURE", "VISIT", "CALL", "OTHER", "TASK"];

const HOUR_START = 7;
const HOUR_END = 20;
const PX_PER_HOUR = 48;
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * dueDate de Task suele ser medianoche UTC (input type=date).
 * Usamos partes UTC para no desplazar el día en US Eastern.
 */
function taskCalendarDate(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthTitle(d: Date): string {
  return d.toLocaleDateString("es-US", { month: "long", year: "numeric" });
}

function formatDayTitle(d: Date): string {
  return d.toLocaleDateString("es-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatWeekTitle(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const a = weekStart.toLocaleDateString("es-US", {
    day: "numeric",
    month: "short",
  });
  const b = end.toLocaleDateString("es-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${a} – ${b}`;
}

function itemDayKey(item: AgendaItem): string {
  if (item.kind === "task") return dateKey(taskCalendarDate(item.dueDate));
  return dateKey(new Date(item.startsAt));
}

function itemMatchesFilter(item: AgendaItem, filters: Set<FilterKey>): boolean {
  if (item.kind === "task") return filters.has("TASK");
  return filters.has(item.type as FilterKey);
}

function hoursArray(): number[] {
  const out: number[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) out.push(h);
  return out;
}

function apptLayout(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const gridStart = HOUR_START * 60;
  const gridEnd = HOUR_END * 60;
  const clampedStart = Math.max(startMin, gridStart);
  const clampedEnd = Math.min(Math.max(endMin, clampedStart + 30), gridEnd);
  const top = ((clampedStart - gridStart) / 60) * PX_PER_HOUR;
  const height = Math.max(((clampedEnd - clampedStart) / 60) * PX_PER_HOUR, 28);
  return { top, height };
}

export function AgendaCalendar({
  appointments,
  tasks,
}: {
  appointments: Omit<AgendaAppointment, "kind">[];
  tasks: Omit<AgendaTask, "kind">[];
}) {
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<ViewMode>("day");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [filters, setFilters] = useState<Set<FilterKey>>(
    () => new Set(FILTERS),
  );
  const [selected, setSelected] = useState<AgendaItem | null>(null);
  const [daySheet, setDaySheet] = useState<Date | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setView(mq.matches ? "week" : "day");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const items = useMemo<AgendaItem[]>(() => {
    const appts: AgendaItem[] = appointments
      .filter((a) => a.status !== "CANCELED")
      .map((a) => ({ ...a, kind: "appointment" as const }));
    const tks: AgendaItem[] = tasks.map((t) => ({
      ...t,
      kind: "task" as const,
    }));
    return [...appts, ...tks].filter((i) => itemMatchesFilter(i, filters));
  }, [appointments, tasks, filters]);

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const key = itemDayKey(item);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.kind === "task" && b.kind !== "task") return -1;
        if (b.kind === "task" && a.kind !== "task") return 1;
        if (a.kind === "task" && b.kind === "task") {
          return a.title.localeCompare(b.title);
        }
        if (a.kind === "appointment" && b.kind === "appointment") {
          return (
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          );
        }
        return 0;
      });
    }
    return map;
  }, [items]);

  const weekStart = startOfWeek(cursor);
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const today = startOfDay(new Date());

  function navigate(dir: -1 | 1) {
    if (view === "month") {
      setCursor(
        new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1),
      );
    } else if (view === "week") {
      setCursor(addDays(cursor, dir * 7));
    } else {
      setCursor(addDays(cursor, dir));
    }
  }

  function toggleFilter(key: FilterKey) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function openItem(item: AgendaItem) {
    setSelected(item);
  }

  function openDay(d: Date) {
    setCursor(startOfDay(d));
    if (window.matchMedia("(min-width: 768px)").matches) {
      setDaySheet(startOfDay(d));
    } else {
      setView("day");
    }
  }

  const title =
    view === "month"
      ? formatMonthTitle(cursor)
      : view === "week"
        ? formatWeekTitle(weekStart)
        : formatDayTitle(cursor);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor(startOfDay(new Date()))}
          >
            Hoy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(1)}
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="ml-1 text-base font-semibold capitalize sm:text-lg">
            {title}
          </h2>
        </div>

        <div className="flex rounded-lg bg-muted p-1">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((key) => {
          const on = filters.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-opacity",
                TYPE_CHIP[key],
                !on && "opacity-40",
              )}
            >
              {TYPE_LABEL[key]}
            </button>
          );
        })}
      </div>

      {view === "month" && (
        <MonthGrid
          gridStart={monthGridStart}
          month={cursor.getMonth()}
          today={today}
          byDay={byDay}
          onOpenDay={openDay}
          onOpenItem={openItem}
        />
      )}

      {view === "week" && (
        <TimeGrid
          days={Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))}
          today={today}
          byDay={byDay}
          onOpenItem={openItem}
        />
      )}

      {view === "day" && (
        <TimeGrid
          days={[cursor]}
          today={today}
          byDay={byDay}
          onOpenItem={openItem}
          single
        />
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected?.kind === "appointment" && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {TYPE_LABEL[selected.type] ?? selected.type} ·{" "}
                  {new Date(selected.startsAt).toLocaleString("es-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 px-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {TYPE_LABEL[selected.type] ?? selected.type}
                  </Badge>
                  <Badge variant="outline">{selected.status}</Badge>
                  {selected.googleEventId && (
                    <Badge variant="outline">Google Calendar</Badge>
                  )}
                </div>
                {(selected.address || selected.city) && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    {[selected.address, selected.city].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selected.mapsUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={selected.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Maps <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                  {selected.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await cancelAppointment({
                            id: selected.id,
                          });
                          if (res.ok) {
                            toast.success("Cita cancelada.");
                            setSelected(null);
                          } else toast.error(res.error ?? "Error");
                        })
                      }
                    >
                      Cancelar cita
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          {selected?.kind === "task" && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  Vence{" "}
                  {taskCalendarDate(selected.dueDate).toLocaleDateString(
                    "es-US",
                    { dateStyle: "medium" },
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 px-1">
                <Badge
                  variant={selected.done ? "outline" : "secondary"}
                  className={TYPE_CHIP.TASK}
                >
                  {selected.done ? "Completada" : "Pendiente"}
                </Badge>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await toggleTask({ taskId: selected.id });
                      if (res.ok) {
                        toast.success(
                          selected.done
                            ? "Tarea marcada pendiente."
                            : "Tarea completada.",
                        );
                        setSelected(null);
                      } else toast.error(res.error ?? "Error");
                    })
                  }
                >
                  {selected.done ? "Marcar pendiente" : "Completar tarea"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!daySheet} onOpenChange={(o) => !o && setDaySheet(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {daySheet && (
            <>
              <SheetHeader>
                <SheetTitle className="capitalize">
                  {formatDayTitle(daySheet)}
                </SheetTitle>
                <SheetDescription>Citas y tareas del día</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2 px-1">
                {(byDay.get(dateKey(daySheet)) ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nada agendado este día.
                  </p>
                )}
                {(byDay.get(dateKey(daySheet)) ?? []).map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setDaySheet(null);
                      openItem(item);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm",
                      item.kind === "task"
                        ? TYPE_CHIP.TASK
                        : TYPE_CHIP[item.type] ?? TYPE_CHIP.OTHER,
                    )}
                  >
                    {item.kind === "task" ? (
                      <CheckSquare className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium">{item.title}</span>
                      {item.kind === "appointment" && (
                        <span className="text-xs opacity-80">
                          {new Date(item.startsAt).toLocaleTimeString("es-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setCursor(daySheet);
                    setView("day");
                    setDaySheet(null);
                  }}
                >
                  Ver día completo
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MonthGrid({
  gridStart,
  month,
  today,
  byDay,
  onOpenDay,
  onOpenItem,
}: {
  gridStart: Date;
  month: number;
  today: Date;
  byDay: Map<string, AgendaItem[]>;
  onOpenDay: (d: Date) => void;
  onOpenItem: (item: AgendaItem) => void;
}) {
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = dateKey(day);
          const dayItems = byDay.get(key) ?? [];
          const inMonth = day.getMonth() === month;
          const isToday = sameDay(day, today);
          const visible = dayItems.slice(0, 3);
          const extra = dayItems.length - visible.length;

          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r p-1 sm:min-h-28",
                !inMonth && "bg-muted/20",
              )}
            >
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className={cn(
                  "mb-1 flex size-7 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                  !inMonth && "text-muted-foreground",
                )}
              >
                {day.getDate()}
              </button>
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenItem(item);
                    }}
                    className={cn(
                      "block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] leading-tight sm:text-xs",
                      item.kind === "task"
                        ? TYPE_CHIP.TASK
                        : TYPE_CHIP[item.type] ?? TYPE_CHIP.OTHER,
                      item.kind === "task" && item.done && "line-through opacity-60",
                    )}
                  >
                    {item.kind === "appointment" && (
                      <span className="mr-0.5 opacity-70">
                        {new Date(item.startsAt).toLocaleTimeString("es-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {item.title}
                  </button>
                ))}
                {extra > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(day)}
                    className="w-full text-left text-[10px] text-muted-foreground sm:text-xs"
                  >
                    +{extra} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({
  days,
  today,
  byDay,
  onOpenItem,
  single,
}: {
  days: Date[];
  today: Date;
  byDay: Map<string, AgendaItem[]>;
  onOpenItem: (item: AgendaItem) => void;
  single?: boolean;
}) {
  const hours = hoursArray();
  const gridHeight = (HOUR_END - HOUR_START) * PX_PER_HOUR;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div
        className={cn(
          "min-w-full",
          single ? "min-w-0" : "min-w-[640px]",
        )}
      >
        <div
          className="grid border-b bg-muted/40"
          style={{
            gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {days.map((day) => (
            <div
              key={dateKey(day)}
              className={cn(
                "px-2 py-2 text-center text-xs font-medium",
                sameDay(day, today) && "text-primary",
              )}
            >
              <div className="text-muted-foreground">
                {day.toLocaleDateString("es-US", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm",
                  sameDay(day, today) && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* All-day row (tasks) */}
        <div
          className="grid border-b"
          style={{
            gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="px-1 py-2 text-[10px] text-muted-foreground">
            Todo el día
          </div>
          {days.map((day) => {
            const tasks = (byDay.get(dateKey(day)) ?? []).filter(
              (i) => i.kind === "task",
            );
            return (
              <div
                key={`allday-${dateKey(day)}`}
                className="min-h-10 space-y-0.5 border-l p-1"
              >
                {tasks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenItem(item)}
                    className={cn(
                      "block w-full truncate rounded border px-1.5 py-0.5 text-left text-xs",
                      TYPE_CHIP.TASK,
                      item.done && "line-through opacity-60",
                    )}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1 text-[10px] text-muted-foreground"
                style={{ top: (h - HOUR_START) * PX_PER_HOUR - 6 }}
              >
                {`${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayAppts = (byDay.get(dateKey(day)) ?? []).filter(
              (i): i is AgendaAppointment => i.kind === "appointment",
            );
            return (
              <div
                key={`col-${dateKey(day)}`}
                className="relative border-l"
                style={{ height: gridHeight }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                  />
                ))}
                {dayAppts.map((appt) => {
                  const { top, height } = apptLayout(appt.startsAt, appt.endsAt);
                  return (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={() => onOpenItem(appt)}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded border px-1.5 py-0.5 text-left text-xs shadow-sm",
                        TYPE_CHIP[appt.type] ?? TYPE_CHIP.OTHER,
                      )}
                      style={{ top, height }}
                    >
                      <span className="block truncate font-medium">
                        {appt.title}
                      </span>
                      <span className="block truncate text-[10px] opacity-80">
                        {TYPE_LABEL[appt.type] ?? appt.type} ·{" "}
                        {new Date(appt.startsAt).toLocaleTimeString("es-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
