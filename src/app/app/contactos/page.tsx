import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default async function ContactosPage() {
  const { businessId } = await requireBusinessSession();

  const contacts = await prisma.contact.findMany({
    where: { businessId },
    include: { _count: { select: { deals: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contactos</h1>
        <p className="text-muted-foreground">
          Personas con las que ya tienes relación comercial.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin contactos. Convierte un lead para crear el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {contact.phone ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell>{contact._count.deals}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
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
