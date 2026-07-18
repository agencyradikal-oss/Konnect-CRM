import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { startOfWeek } from "@/lib/date-range";
import { leadSourceLabels } from "@/components/crm/stage-badge";
import {
  LeadsSourceChart,
  LeadsWeeklyChart,
} from "@/components/crm/dashboard-charts";

export default async function AnalyticsPage() {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getPlanLimits(business.plan);

  if (!limits.analytics) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Analytics del perfil</h1>
        <p className="text-muted-foreground">
          Disponible en el plan Premium: vistas, clicks por tipo y leads por
          semana.
        </p>
        <Button asChild>
          <Link href="/app/plan">Actualizar a Premium</Link>
        </Button>
      </div>
    );
  }

  const eightWeeksAgo = startOfWeek(new Date());
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7);

  const [views, leads] = await Promise.all([
    prisma.pageView.findMany({
      where: { businessId, createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where: { businessId, createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true, source: true },
    }),
  ]);

  const weeklyMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(new Date());
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeklyMap.set(weekStart.toISOString().slice(0, 10), 0);
  }
  for (const lead of leads) {
    const key = startOfWeek(lead.createdAt).toISOString().slice(0, 10);
    if (weeklyMap.has(key)) {
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
    }
  }
  const weeklyData = [...weeklyMap.entries()].map(([iso, count]) => ({
    week: new Date(iso).toLocaleDateString("es-US", {
      month: "short",
      day: "numeric",
    }),
    leads: count,
  }));

  const viewsWeekly = new Map<string, number>();
  for (const key of weeklyMap.keys()) viewsWeekly.set(key, 0);
  for (const v of views) {
    const key = startOfWeek(v.createdAt).toISOString().slice(0, 10);
    if (viewsWeekly.has(key)) {
      viewsWeekly.set(key, (viewsWeekly.get(key) ?? 0) + 1);
    }
  }
  const viewsChart = [...viewsWeekly.entries()].map(([iso, count]) => ({
    week: new Date(iso).toLocaleDateString("es-US", {
      month: "short",
      day: "numeric",
    }),
    leads: count, // reuse chart series key
  }));

  const clickSources = [
    "CLICK_CALL",
    "CLICK_WHATSAPP",
    "DIRECTORY_FORM",
    "QUOTE_REQUEST",
  ] as const;
  const sourceCounts = new Map<string, number>();
  for (const s of clickSources) sourceCounts.set(leadSourceLabels[s], 0);
  for (const lead of leads) {
    if ((clickSources as readonly string[]).includes(lead.source)) {
      const label = leadSourceLabels[lead.source];
      sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
    }
  }
  const sourceData = [...sourceCounts.entries()].map(([name, value]) => ({
    name,
    value,
  }));

  const totalViews = views.length;
  const totalClicks = leads.filter((l) =>
    l.source.startsWith("CLICK_"),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Rendimiento de tu perfil público — últimas 8 semanas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Vistas del perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalViews}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Clicks (llamada / WhatsApp)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalClicks}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Leads totales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{leads.length}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsWeeklyChart
          data={viewsChart}
          title="Vistas por semana"
          seriesName="Vistas"
        />
        <LeadsWeeklyChart
          data={weeklyData}
          title="Leads por semana"
          seriesName="Leads"
        />
      </div>

      <LeadsSourceChart data={sourceData} />
    </div>
  );
}
