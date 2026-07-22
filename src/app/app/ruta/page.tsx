import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { DayRoutePanel } from "@/components/crm/day-route-panel";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Ruta del día" } satisfies Metadata;
export const dynamic = "force-dynamic";

export default async function RutaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getPlanLimits(business.plan);
  const params = await searchParams;

  if (!limits.dayRoutes) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Ruta del día</h1>
        <p className="text-muted-foreground">
          Optimizar rutas de medidas/visitas está disponible en plan Premium.
        </p>
        <Button asChild>
          <Link href="/app/plan">Ver planes</Link>
        </Button>
      </div>
    );
  }

  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : new Date().toISOString().slice(0, 10);

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      status: "SCHEDULED",
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    orderBy: [{ routeOrder: "asc" }, { startsAt: "asc" }],
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ruta del día</h1>
          <p className="text-muted-foreground">
            Ordena paradas y abre la ruta en Google Maps.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" variant="outline" size="sm">
            Ver
          </Button>
        </form>
      </div>

      <DayRoutePanel
        date={date}
        appointments={appointments.map((a) => ({
          id: a.id,
          title: a.title,
          startsAt: a.startsAt.toISOString(),
          address: a.address,
          city: a.city,
          mapsUrl: a.mapsUrl,
          routeOrder: a.routeOrder,
        }))}
      />
    </div>
  );
}
