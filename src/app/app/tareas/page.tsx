import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { TaskList } from "@/components/crm/task-list";

export default async function TareasPage() {
  const { businessId } = await getCurrentBusiness();

  const tasks = await prisma.task.findMany({
    where: { businessId },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
        <p className="text-muted-foreground">
          Agrupadas por vencimiento — checkbox para completar.
        </p>
      </div>

      <TaskList
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          dueDate: t.dueDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
