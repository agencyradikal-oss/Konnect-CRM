import Link from "next/link";
import {
  Clock,
  Inbox,
  Handshake,
  DollarSign,
  Trophy,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import {
  endOfDay,
  formatMoney,
  pctChange,
  startOfDay,
  startOfMonth,
  startOfNextMonth,
  startOfPrevMonth,
  startOfWeek,
} from "@/lib/date-range";
import { MetricCard } from "@/components/crm/metric-card";
import {
  LeadsSourceChart,
  LeadsWeeklyChart,
} from "@/components/crm/dashboard-charts";
import {
  LeadStatusBadge,
  LeadSourceBadge,
  leadSourceLabels,
} from "@/components/crm/stage-badge";
import { toggleTask } from "@/actions/crm";

const OPEN_STAGES = ["NUEVO", "CONTACTADO", "COTIZADO", "NEGOCIACION"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { businessId, session, business } = await getCurrentBusiness();
  const { nuevo } = await searchParams;

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const prevMonthStart = startOfPrevMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const eightWeeksAgo = startOfWeek(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7);

  const [
    leadsThisMonth,
    leadsPrevMonth,
    openDealsNow,
    openDealsPrevMonthCreated,
    pipelineThis,
    pipelinePrev,
    wonThis,
    wonPrev,
    wonValueThis,
    recentLeads,
    todayTasks,
    allLeadsForCharts,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        businessId,
        createdAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
    }),
    prisma.lead.count({
      where: {
        businessId,
        createdAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.deal.count({
      where: { businessId, stage: { in: [...OPEN_STAGES] } },
    }),
    prisma.deal.count({
      where: {
        businessId,
        stage: { in: [...OPEN_STAGES] },
        createdAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.deal.aggregate({
      where: { businessId, stage: { in: [...OPEN_STAGES] } },
      _sum: { value: true },
    }),
    prisma.deal.aggregate({
      where: {
        businessId,
        stage: { in: [...OPEN_STAGES] },
        createdAt: { lt: thisMonthStart },
      },
      _sum: { value: true },
    }),
    prisma.deal.count({
      where: {
        businessId,
        stage: "GANADO",
        updatedAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
    }),
    prisma.deal.count({
      where: {
        businessId,
        stage: "GANADO",
        updatedAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.deal.aggregate({
      where: {
        businessId,
        stage: "GANADO",
        updatedAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
      _sum: { value: true },
    }),
    prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        businessId,
        done: false,
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    prisma.lead.findMany({
      where: { businessId, createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true, source: true },
    }),
  ]);

  const pipelineValue = Number(pipelineThis._sum.value ?? 0);
  const pipelinePrevValue = Number(pipelinePrev._sum.value ?? 0);
  const wonValueNum = Number(wonValueThis._sum.value ?? 0);

  const weeklyMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const key = weekStart.toISOString().slice(0, 10);
    weeklyMap.set(key, 0);
  }
  for (const lead of allLeadsForCharts) {
    const ws = startOfWeek(lead.createdAt);
    const key = ws.toISOString().slice(0, 10);
    if (weeklyMap.has(key)) {
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
    }
  }
  const weeklyData = [...weeklyMap.entries()].map(([iso, leads]) => {
    const d = new Date(iso);
    return {
      week: d.toLocaleDateString("es-US", { month: "short", day: "numeric" }),
      leads,
    };
  });

  const sourceCounts = new Map<string, number>();
  for (const lead of allLeadsForCharts) {
    const label = leadSourceLabels[lead.source] ?? lead.source;
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  }
  const sourceData = [...sourceCounts.entries()].map(([name, value]) => ({
    name,
    value,
  }));

  const showReviewBanner = business.status === "PENDING" || nuevo === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Hola{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Resumen de tu CRM — mes actual vs anterior
        </p>
      </div>

      {showReviewBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <Clock className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Tu perfil está en revisión</p>
            <p className="text-sm opacity-90">
              Nuestro equipo revisará <strong>{business.name}</strong> y te
              avisaremos por email. Mientras tanto puedes editar tu{" "}
              <Link href="/app/perfil" className="underline underline-offset-2">
                perfil público
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Leads nuevos"
          value={leadsThisMonth}
          href="/app/leads"
          icon={Inbox}
          changePct={pctChange(leadsThisMonth, leadsPrevMonth)}
        />
        <MetricCard
          label="Deals abiertos"
          value={openDealsNow}
          href="/app/deals"
          icon={Handshake}
          changePct={pctChange(openDealsNow, openDealsPrevMonthCreated)}
        />
        <MetricCard
          label="Valor del pipeline"
          value={formatMoney(pipelineValue)}
          href="/app/deals"
          icon={DollarSign}
          changePct={pctChange(pipelineValue, pipelinePrevValue)}
        />
        <MetricCard
          label="Deals ganados"
          value={wonThis}
          href="/app/deals"
          icon={Trophy}
          changePct={pctChange(wonThis, wonPrev)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LeadsWeeklyChart data={weeklyData} />
        </div>
        <div className="lg:col-span-2">
          <LeadsSourceChart data={sourceData} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Tareas de hoy</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/tareas">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tienes tareas para hoy.
              </p>
            ) : (
              <ul className="divide-y">
                {todayTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 py-2.5">
                    <form
                      action={async () => {
                        "use server";
                        await toggleTask({ taskId: task.id });
                      }}
                    >
                      <button
                        type="submit"
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Completar tarea"
                      >
                        <CheckSquare className="size-4" />
                      </button>
                    </form>
                    <span className="flex-1 text-sm">{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Últimos 5 leads</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/leads">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {recentLeads.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Aún no tienes leads. Comparte tu perfil público.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <LeadSourceBadge source={lead.source} />
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {wonValueNum > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Ventas ganadas este mes:{" "}
          <span className="font-semibold text-foreground">
            {formatMoney(wonValueNum)}
          </span>
        </p>
      )}
    </div>
  );
}
