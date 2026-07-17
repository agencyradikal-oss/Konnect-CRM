import { Card, CardContent } from "@/components/ui/card";
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
import { LeadRowActions } from "@/components/crm/lead-row-actions";

export default async function LeadsPage() {
  const { businessId } = await requireBusinessSession();

  const leads = await prisma.lead.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground">
          Interacciones de tu perfil público, registradas automáticamente.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin leads todavía.
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
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-medium">{lead.name}</p>
                      {lead.message && (
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-muted-foreground">
                          {lead.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {lead.phone ?? lead.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {leadSourceLabels[lead.source]}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {lead.createdAt.toLocaleDateString("es-US")}
                    </TableCell>
                    <TableCell>
                      <LeadRowActions leadId={lead.id} status={lead.status} />
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
