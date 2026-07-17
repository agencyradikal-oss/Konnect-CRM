"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleTask, createTask } from "@/actions/crm";

type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
};

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  const [pending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await createTask(data);
        if (res.ok) form.reset();
      } catch {
        toast.error("Escribe un título para la tarea.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex gap-2">
        <Input name="title" placeholder="Nueva tarea..." required />
        <Input name="dueDate" type="date" className="w-40" />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin tareas pendientes.
            </p>
          ) : (
            <ul className="divide-y">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await toggleTask({ taskId: task.id });
                        if (!res.ok) toast.error(res.error);
                      })
                    }
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
                        task.done && "text-muted-foreground line-through"
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
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
