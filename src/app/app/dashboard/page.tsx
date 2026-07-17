import Link from "next/link";
import { Inbox, Users, Handshake, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { LeadStatusBadge, leadSourceLabels } from "@/components/crm/stage-badge";

export default async function DashboardPage() {
  const { businessId } = await requireBusinessSession();

  const [newLeads, contacts, openDeals, wonValue, recentLeads] =
    await Promise.all([
      prisma.lead.count({ where: { businessId, status: "NEW" } }),
      prisma.contact.count({ where: { businessId } }),
      prisma.deal.count({
        where: { businessId, stage: { notIn: ["GANADO", "PERDIDO"] } },
      }),
      prisma.deal.aggregate({
        where: { businessId, stage: "GANADO" },
        _sum: { value: true },
      }),
      prisma.lead.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const metrics = [
    { label: "Leads nuevos", value: newLeads, icon: Inbox, href: "/app/leads" },
    { label: "Contactos", value: contacts, icon: Users, href: "/app/contactos" },
    { label: "Deals abiertos", value: openDeals, icon: Handshake, href: "/app/deals" },
    {
      label: "Ventas ganadas",
      value: `$${Number(wonValue._sum.value ?? 0).toLocaleString("en-US")}`,
      icon: DollarSign,
      href: "/app/deals",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Últimos leads — El Puente en acción */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              Aún no tienes leads. Comparte tu perfil público para empezar a
              recibirlos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{leadSourceLabels[lead.source]}</TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {lead.createdAt.toLocaleDateString("es-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
