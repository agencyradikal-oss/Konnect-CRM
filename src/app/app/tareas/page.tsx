import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { TaskList } from "@/components/crm/task-list";

export default async function TareasPage() {
  const { businessId } = await requireBusinessSession();

  const tasks = await prisma.task.findMany({
    where: { businessId },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tareas</h1>
        <p className="text-muted-foreground">
          Pendientes de seguimiento de tu negocio.
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
