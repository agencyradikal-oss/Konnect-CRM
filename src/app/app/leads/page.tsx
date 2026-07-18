import { Suspense } from "react";
import Link from "next/link";
import type { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { monthBounds, unlockedLeadIdsForMonth } from "@/lib/lead-access";
import {
  LeadStatusBadge,
  LeadSourceBadge,
} from "@/components/crm/stage-badge";
import { LeadRowActions } from "@/components/crm/lead-row-actions";
import { LeadMessageCell } from "@/components/crm/lead-message-cell";
import { LeadsFilters } from "@/components/crm/leads-filters";
import { LockedLeadRow } from "@/components/crm/locked-lead-row";

const sources = new Set<string>([
  "DIRECTORY_FORM",
  "QUOTE_REQUEST",
  "CLICK_CALL",
  "CLICK_WHATSAPP",
  "MANUAL",
  "IMPORT",
  "REFERRAL",
]);

const statuses = new Set<string>([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
]);

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; status?: string }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  const params = await searchParams;
  const limits = getPlanLimits(business.plan);
  const { start, end } = monthBounds();

  const source =
    params.source && sources.has(params.source)
      ? (params.source as LeadSource)
      : undefined;
  const status =
    params.status && statuses.has(params.status)
      ? (params.status as LeadStatus)
      : undefined;

  const where: Prisma.LeadWhereInput = {
    businessId,
    ...(source && { source }),
    ...(status && { status }),
  };

  const [leads, monthLeadIds] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.lead.findMany({
      where: {
        businessId,
        createdAt: { gte: start, lt: end },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const unlocked = unlockedLeadIdsForMonth(
    monthLeadIds.map((l) => l.id),
    business.plan,
  );
  const monthCount = monthLeadIds.length;
  const lockedCount =
    limits.leadsPerMonth === null
      ? 0
      : Math.max(0, monthCount - limits.leadsPerMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Interacciones de tu perfil público, registradas automáticamente.
            {limits.leadsPerMonth !== null && (
              <>
                {" "}
                Plan Free: {Math.min(monthCount, limits.leadsPerMonth)}/
                {limits.leadsPerMonth} visibles este mes
                {lockedCount > 0 ? ` · ${lockedCount} bloqueados` : ""}.
              </>
            )}
          </p>
        </div>
        <Suspense fallback={null}>
          <LeadsFilters source={source} status={status} />
        </Suspense>
      </div>

      {lockedCount > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Tienes {lockedCount} lead{lockedCount === 1 ? "" : "s"} bloqueado
            {lockedCount === 1 ? "" : "s"} este mes. Se guardaron, pero el plan
            Free solo muestra los primeros {limits.leadsPerMonth}.
          </p>
          <Button asChild size="sm">
            <Link href="/app/plan">Actualizar a Pro</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin leads con estos filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="hidden lg:table-cell">Mensaje</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const inMonth =
                    lead.createdAt >= start && lead.createdAt < end;
                  const locked =
                    inMonth &&
                    limits.leadsPerMonth !== null &&
                    !unlocked.has(lead.id);

                  if (locked) {
                    return <LockedLeadRow key={lead.id} />;
                  }

                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <p className="font-medium">{lead.name}</p>
                        <div className="mt-1 lg:hidden">
                          <LeadMessageCell message={lead.message} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {[lead.phone, lead.email].filter(Boolean).join(" · ") ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        <LeadSourceBadge source={lead.source} />
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {lead.createdAt.toLocaleString("es-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <LeadMessageCell message={lead.message} />
                      </TableCell>
                      <TableCell>
                        <LeadRowActions
                          leadId={lead.id}
                          leadName={lead.name}
                          status={lead.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
