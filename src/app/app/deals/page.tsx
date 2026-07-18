import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { daysBetween, type DealCardData } from "@/lib/deals";
import { DealsBoard } from "@/components/crm/deals-board";

export default async function DealsPage() {
  const { businessId } = await getCurrentBusiness();

  const deals = await prisma.deal.findMany({
    where: { businessId },
    include: {
      contact: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, type: true, content: true, createdAt: true },
      },
      tasks: {
        orderBy: [{ done: "asc" }, { createdAt: "desc" }],
        take: 20,
        select: { id: true, title: true, done: true, dueDate: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

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
      done: t.done,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
  }));

  const pipeline = payload
    .filter((d) => d.stage !== "GANADO" && d.stage !== "PERDIDO")
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  return <DealsBoard deals={payload} pipeline={pipeline} />;
}
