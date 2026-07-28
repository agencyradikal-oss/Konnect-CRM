"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createTask,
  toggleTask,
  updateTask,
  updateTaskStatus,
} from "@/actions/crm";
import {
  TASK_STATUSES,
  isTaskDone,
  memberLabel,
  type BusinessMember,
  type TaskCardData,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "mine" | "unassigned";

function TaskCard({
  task,
  dragging,
}: {
  task: TaskCardData;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing",
        (isDragging || dragging) && "opacity-40",
        isTaskDone(task.status) && "opacity-75",
      )}
    >
      <p
        className={cn(
          "text-sm font-semibold leading-snug",
          isTaskDone(task.status) && "line-through text-muted-foreground",
        )}
      >
        {task.title}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{memberLabel(task.assignee)}</span>
        {task.dueDate ? (
          <span className="shrink-0">
            {new Date(task.dueDate).toLocaleDateString("es-US")}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: TaskCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto p-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TasksBoard({
  tasks: initialTasks,
  members,
  currentUserId,
}: {
  tasks: TaskCardData[];
  members: BusinessMember[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    if (filter === "mine") {
      return tasks.filter((t) => t.assigneeId === currentUserId);
    }
    if (filter === "unassigned") {
      return tasks.filter((t) => !t.assigneeId);
    }
    return tasks;
  }, [tasks, filter, currentUserId]);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(
      TASK_STATUSES.map((s) => [s.id, [] as TaskCardData[]]),
    ) as Record<TaskStatus, TaskCardData[]>;
    for (const t of filtered) map[t.status].push(t);
    return map;
  }, [filtered]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus: TaskStatus | null = null;
    const overId = String(over.id);
    if (TASK_STATUSES.some((s) => s.id === overId)) {
      nextStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) nextStatus = overTask.status;
    }

    if (!nextStatus || nextStatus === task.status) return;

    const prev = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status: nextStatus! } : t)),
    );

    startTransition(async () => {
      const res = await updateTaskStatus({ taskId, status: nextStatus });
      if (!res.ok) {
        setTasks(prev);
        toast.error(res.error ?? "No se pudo mover la tarea.");
      }
    });
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const res = await createTask({
        title: title.trim(),
        dueDate,
        assigneeId: assigneeId || "",
      });
      if (res.ok) {
        setTitle("");
        setDueDate("");
        setAssigneeId("");
        toast.success("Tarea creada.");
      } else {
        toast.error(res.error ?? "No se pudo crear.");
      }
    });
  }

  function onAssigneeChange(taskId: string, next: string) {
    const value = next === "__none__" ? null : next;
    const member =
      value == null ? null : (members.find((m) => m.id === value) ?? null);
    const prev = tasks;
    setTasks((list) =>
      list.map((t) =>
        t.id === taskId
          ? { ...t, assigneeId: value, assignee: member }
          : t,
      ),
    );
    startTransition(async () => {
      const res = await updateTask({ taskId, assigneeId: value });
      if (!res.ok) {
        setTasks(prev);
        toast.error(res.error ?? "No se pudo asignar.");
      }
    });
  }

  function onStatusChange(taskId: string, status: TaskStatus) {
    const prev = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
    startTransition(async () => {
      const res = await updateTaskStatus({ taskId, status });
      if (!res.ok) {
        setTasks(prev);
        toast.error(res.error ?? "No se pudo actualizar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onCreate}
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nueva tarea..."
          required
          className="flex-1 sm:min-w-[200px]"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="sm:w-44"
        />
        <Select
          value={assigneeId || "__none__"}
          onValueChange={(v) => setAssigneeId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Asignar a" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin asignar</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {memberLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-background p-1">
          {(
            [
              { id: "all", label: "Todas" },
              { id: "mine", label: "Mías" },
              { id: "unassigned", label: "Sin asignar" },
            ] as const
          ).map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={filter === f.id ? "default" : "ghost"}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "kanban" ? "default" : "ghost"}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="size-4" /> Kanban
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            onClick={() => setView("table")}
          >
            <List className="size-4" /> Lista
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
            {TASK_STATUSES.map((s) => (
              <Column
                key={s.id}
                status={s.id}
                label={s.label}
                tasks={byStatus[s.id]}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="w-72 rounded-lg border bg-card p-3 shadow-lg">
                <p className="text-sm font-semibold">{activeTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Sin tareas en este filtro.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Asignado</TableHead>
                    <TableHead className="hidden md:table-cell">Vence</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell
                        className={cn(
                          "font-medium",
                          isTaskDone(task.status) &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(v) =>
                            onStatusChange(task.id, v as TaskStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUSES.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Select
                          value={task.assigneeId ?? "__none__"}
                          onValueChange={(v) => onAssigneeChange(task.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin asignar</SelectItem>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {memberLabel(m)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("es-US")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await toggleTask({ taskId: task.id });
                              if (!res.ok) toast.error(res.error);
                            })
                          }
                        >
                          {isTaskDone(task.status) ? "Reabrir" : "Hecha"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Sin tareas. Agrega la primera arriba.
        </p>
      )}
    </div>
  );
}
