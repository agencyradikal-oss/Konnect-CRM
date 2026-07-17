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
import { DealStageSelect } from "@/components/crm/deal-stage-select";

export default async function DealsPage() {
  const { businessId } = await requireBusinessSession();

  const deals = await prisma.deal.findMany({
    where: { businessId },
    include: { contact: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const pipeline = deals
    .filter((d) => d.stage !== "GANADO" && d.stage !== "PERDIDO")
    .reduce((sum, d) => sum + Number(d.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deals</h1>
        <p className="text-muted-foreground">
          Pipeline abierto: ${pipeline.toLocaleString("en-US")}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {deals.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin deals. Convierte un lead para crear el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="hidden lg:table-cell">Cierre esperado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {deal.contact?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {deal.value
                        ? `$${Number(deal.value).toLocaleString("en-US")}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DealStageSelect dealId={deal.id} stage={deal.stage} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {deal.expectedClose?.toLocaleDateString("es-US") ?? "—"}
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
