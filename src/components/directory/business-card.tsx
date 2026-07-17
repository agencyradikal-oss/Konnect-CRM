import Link from "next/link";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Business, Category } from "@prisma/client";

export function BusinessCard({
  business,
}: {
  business: Business & { category: Category };
}) {
  return (
    <Link href={`/negocio/${business.slug}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{business.name}</h3>
            {business.verified && (
              <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Verificado" />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{business.category.nameEs}</Badge>
            {business.featured && <Badge>Destacado</Badge>}
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {business.description}
          </p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            {business.city && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {business.city}, {business.state}
              </span>
            )}
            {business.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-4 text-primary" />
                {business.phone}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
