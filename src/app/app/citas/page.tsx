import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { AppointmentsPanel } from "@/components/crm/appointments-panel";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Citas" } satisfies Metadata;
export const dynamic = "force-dynamic";

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{
    leadId?: string;
    dealId?: string;
    contactId?: string;
    title?: string;
  }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getPlanLimits(business.plan);
  const params = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  let prefill: {
    title?: string;
    leadId?: string;
    dealId?: string;
    contactId?: string;
    notes?: string;
  } | undefined;

  if (params.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: params.leadId, businessId },
      select: {
        id: true,
        name: true,
        message: true,
        phone: true,
        email: true,
        contactId: true,
        dealId: true,
      },
    });
    if (lead) {
      prefill = {
        leadId: lead.id,
        dealId: lead.dealId ?? undefined,
        contactId: lead.contactId ?? undefined,
        title: params.title?.trim() || `Medida — ${lead.name}`,
        notes: [
          lead.phone ? `Tel: ${lead.phone}` : "",
          lead.email ? `Email: ${lead.email}` : "",
          lead.message ? `Lead: ${lead.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
  } else if (params.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: params.dealId, businessId },
      select: {
        id: true,
        title: true,
        notes: true,
        contactId: true,
        contact: { select: { id: true, name: true, phone: true } },
      },
    });
    if (deal) {
      const who = deal.contact?.name ?? deal.title;
      prefill = {
        dealId: deal.id,
        contactId: deal.contactId ?? params.contactId ?? undefined,
        title: params.title?.trim() || `Medida — ${who}`,
        notes: [
          deal.contact?.phone ? `Tel: ${deal.contact.phone}` : "",
          deal.notes ? `Deal: ${deal.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
  } else if (params.title || params.contactId) {
    prefill = {
      title: params.title,
      contactId: params.contactId,
    };
  }

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
        prefill={prefill}
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
