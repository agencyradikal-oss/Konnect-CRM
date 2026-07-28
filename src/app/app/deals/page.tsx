import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getBusinessPlanLimits } from "@/lib/plans";
import { daysBetween, type DealCardData } from "@/lib/deals";
import { isTaskDone, type BusinessMember } from "@/lib/tasks";
import { DealsBoard } from "@/components/crm/deals-board";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  const canUseEstimates = getBusinessPlanLimits(business).estimates;
  const params = await searchParams;

  const [deals, members] = await Promise.all([
    prisma.deal.findMany({
      where: { businessId },
      include: {
        contact: { select: { id: true, name: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, type: true, content: true, createdAt: true },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            assigneeId: true,
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
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

  const payload: DealCardData[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    value: d.value != null ? Number(d.value) : null,
    notes: d.notes,
    expectedClose: d.expectedClose?.toISOString() ?? null,
    updatedAt: d.updatedAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    daysInStage: daysBetween(d.updatedAt),
    contact: d.contact,
    activities: d.activities.map((a) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
    })),
    tasks: d.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      done: isTaskDone(t.status),
      dueDate: t.dueDate?.toISOString() ?? null,
      assigneeId: t.assigneeId,
      assignee: t.assignee,
    })),
  }));

  const pipeline = payload
    .filter((d) => d.stage !== "GANADO" && d.stage !== "PERDIDO")
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  const memberList: BusinessMember[] = members;

  return (
    <DealsBoard
      deals={payload}
      pipeline={pipeline}
      initialDealId={params.deal ?? null}
      canUseEstimates={canUseEstimates}
      members={memberList}
    />
  );
}
