import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { AppointmentsPanel } from "@/components/crm/appointments-panel";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Citas" } satisfies Metadata;
export const dynamic = "force-dynamic";

export default async function CitasPage() {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getPlanLimits(business.plan);

  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Citas</h1>
          <p className="text-muted-foreground">
            Medidas y visitas con dirección, Maps y Google Calendar.
          </p>
        </div>
        <div className="flex gap-2">
          {limits.dayRoutes && (
            <Button asChild variant="outline" size="sm">
              <Link href="/app/ruta">Ruta del día</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/app/integraciones">Google</Link>
          </Button>
        </div>
      </div>

      <AppointmentsPanel
        canSyncCalendar={limits.googleCalendar}
        appointments={appointments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          status: a.status,
          startsAt: a.startsAt.toISOString(),
          endsAt: a.endsAt.toISOString(),
          address: a.address,
          city: a.city,
          mapsUrl: a.mapsUrl,
          googleEventId: a.googleEventId,
        }))}
      />
    </div>
  );
}
