import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { TasksBoard } from "@/components/crm/tasks-board";
import type { BusinessMember, TaskCardData } from "@/lib/tasks";

export default async function TareasPage() {
  const { businessId, session } = await getCurrentBusiness();

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { businessId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.user.findMany({
      where: {
        businessId,
        disabled: false,
        role: { in: ["BUSINESS_OWNER", "BUSINESS_STAFF"] },
      },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
  ]);

  const memberList: BusinessMember[] = members;
  const taskCards: TaskCardData[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    dueDate: t.dueDate?.toISOString() ?? null,
    dealId: t.dealId,
    assigneeId: t.assigneeId,
    assignee: t.assignee,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
        <p className="text-muted-foreground">
          Tablero o lista — asigna al equipo del negocio.
        </p>
      </div>

      <TasksBoard
        tasks={taskCards}
        members={memberList}
        currentUserId={session.user.id}
      />
    </div>
  );
}
