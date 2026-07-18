"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleTask, createTask } from "@/actions/crm";
import { endOfDay, startOfDay } from "@/lib/date-range";

type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
};

type GroupKey = "overdue" | "today" | "week" | "later";

const GROUP_LABELS: Record<GroupKey, string> = {
  overdue: "Vencidas",
  today: "Hoy",
  week: "Esta semana",
  later: "Después",
};

function groupTasks(tasks: TaskItem[]) {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  const weekEnd = endOfDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - (now.getDay() || 7))),
  ).getTime();

  const groups: Record<GroupKey, TaskItem[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  };

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  for (const task of open) {
    if (!task.dueDate) {
      groups.later.push(task);
      continue;
    }
    const due = new Date(task.dueDate).getTime();
    if (due < todayStart) groups.overdue.push(task);
    else if (due <= todayEnd) groups.today.push(task);
    else if (due <= weekEnd) groups.week.push(task);
    else groups.later.push(task);
  }

  return { groups, done };
}

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  const [pending, startTransition] = useTransition();
  const { groups, done } = useMemo(() => groupTasks(tasks), [tasks]);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await createTask(data);
        if (res.ok) form.reset();
        else toast.error(res.error);
      } catch {
        toast.error("Escribe un título para la tarea.");
      }
    });
  }

  function renderGroup(key: GroupKey) {
    const list = groups[key];
    if (list.length === 0) return null;
    return (
      <Card key={key} className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{GROUP_LABELS[key]}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {list.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {list.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                pending={pending}
                onToggle={() =>
                  startTransition(async () => {
                    const res = await toggleTask({ taskId: task.id });
                    if (!res.ok) toast.error(res.error);
                  })
                }
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onCreate}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input name="title" placeholder="Nueva tarea..." required className="flex-1" />
        <Input name="dueDate" type="date" className="sm:w-44" />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </form>

      {(["overdue", "today", "week", "later"] as GroupKey[]).map(renderGroup)}

      {done.length > 0 && (
        <Card className="shadow-sm opacity-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">
              Completadas ({done.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {done.slice(0, 20).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  pending={pending}
                  onToggle={() =>
                    startTransition(async () => {
                      await toggleTask({ taskId: task.id });
                    })
                  }
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Sin tareas. Agrega la primera arriba.
        </p>
      )}
    </div>
  );
}

function TaskRow({
  task,
  pending,
  onToggle,
}: {
  task: TaskItem;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={pending}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
      >
        {task.done ? (
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
        ) : (
          <Circle className="size-5 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn(
            "flex-1",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
        {task.dueDate && (
          <span className="text-sm text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString("es-US")}
          </span>
        )}
      </button>
    </li>
  );
}
