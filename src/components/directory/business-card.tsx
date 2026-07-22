import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, Phone, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Business, Category } from "@prisma/client";

export function BusinessCard({
  business,
}: {
  business: Business & { category: Category };
}) {
  return (
    <Link href={`/negocio/${business.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden transition-colors hover:border-primary">
        <div className="relative aspect-[16/9] bg-muted">
          {business.coverUrl ? (
            <Image
              src={business.coverUrl}
              alt=""
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <Store className="size-10" aria-hidden />
            </div>
          )}
          {business.logoUrl ? (
            <div className="absolute bottom-3 left-3 size-14 overflow-hidden rounded-lg border-2 border-background bg-background shadow-sm">
              <Image
                src={business.logoUrl}
                alt={`Logo de ${business.name}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{business.name}</h3>
            {business.verified && (
              <BadgeCheck
                className="size-5 shrink-0 text-primary"
                aria-label="Verificado"
              />
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
