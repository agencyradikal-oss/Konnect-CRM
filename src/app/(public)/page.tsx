import Link from "next/link";
import { Search, BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { nameEs: "asc" },
    }),
    prisma.business.findMany({
      where: { status: "ACTIVE", featured: true },
      include: { category: true },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Encuentra negocios hispanos en{" "}
            <span className="text-primary">Atlanta</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Remodelación, restaurantes, salud, legal y más — con atención en tu
            idioma.
          </p>

          <form
            action="/directorio"
            className="mx-auto mt-8 flex max-w-xl gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="¿Qué buscas? Ej: countertops, tacos, abogado..."
                className="h-12 pl-9"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              Buscar
            </Button>
          </form>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold">Categorías</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="p-4">
                  <p className="font-medium">{cat.nameEs}</p>
                  <p className="text-xs text-muted-foreground">{cat.nameEn}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Negocios destacados</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/directorio">
                Ver todos <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((biz) => (
              <Link key={biz.id} href={`/negocio/${biz.slug}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{biz.name}</h3>
                      {biz.verified && (
                        <BadgeCheck className="size-5 shrink-0 text-primary" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {biz.category.nameEs}
                    </Badge>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {biz.description}
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">
                      {biz.city}, GA
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA registro */}
      <section className="border-t bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
          <h2 className="text-3xl font-bold">¿Tienes un negocio?</h2>
          <p className="max-w-lg text-sidebar-foreground/80">
            Publica tu perfil gratis y recibe leads directo en tu CRM: cada
            llamada, WhatsApp o formulario queda registrado automáticamente.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/registrar-empresa">Registra tu negocio gratis</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
