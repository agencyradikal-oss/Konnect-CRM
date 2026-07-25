import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getBusinessPlanLimits } from "@/lib/plans";
import { formatMoney } from "@/lib/date-range";
import { decimalToNumber } from "@/lib/document-money";

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  VIEWED: "Visto",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Expirado",
  VOID: "Anulado",
};

export default async function PresupuestosPage() {
  const { businessId, business } = await getCurrentBusiness();
  const canUse = getBusinessPlanLimits(business).estimates;

  if (!canUse) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
        <Card>
          <CardHeader>
            <CardTitle>Plan Pro o Premium</CardTitle>
            <CardDescription>
              Crea y envía presupuestos desde tus deals. Disponible en Pro y
              Premium.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app/plan">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estimates = await prisma.estimate.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      deal: { select: { id: true, title: true } },
      contact: { select: { name: true } },
      invoice: { select: { status: true, number: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileText className="size-6 text-primary" />
          Presupuestos
        </h1>
        <p className="text-muted-foreground">
          Crea y envía desde la ficha del deal. Aquí ves el historial.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {estimates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay presupuestos. Abre un deal y crea el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Deal / Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.number}</TableCell>
                    <TableCell>
                      <div>{e.deal?.title ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.contact?.name ?? "Sin contacto"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {statusLabel[e.status] ?? e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMoney(decimalToNumber(e.total))}</TableCell>
                    <TableCell>
                      {e.invoice
                        ? `#${e.invoice.number} · ${e.invoice.status}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.dealId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/app/deals?deal=${e.dealId}`}>
                            Abrir deal
                          </Link>
                        </Button>
                      ) : null}
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
