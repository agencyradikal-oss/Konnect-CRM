import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Globe, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ContactForm } from "@/components/directory/contact-form";
import { ClickActions } from "@/components/directory/click-actions";

type Props = { params: Promise<{ slug: string }> };

async function getBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return {};
  return {
    title: `${business.name} — ${business.category.nameEs} en ${business.city ?? "Atlanta"}, GA`,
    description:
      business.description?.slice(0, 155) ??
      `${business.name}: ${business.category.nameEs} en ${business.city}, Georgia.`,
    openGraph: {
      title: business.name,
      description: business.description?.slice(0, 155),
      type: "website",
    },
  };
}

export default async function NegocioPage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business || business.status !== "ACTIVE") notFound();

  const avgRating =
    business.reviews.length > 0
      ? business.reviews.reduce((sum, r) => sum + r.rating, 0) /
        business.reviews.length
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description ?? undefined,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/negocio/${business.slug}`,
    telephone: business.phone ?? undefined,
    email: business.email ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address ?? undefined,
      addressLocality: business.city ?? undefined,
      addressRegion: business.state ?? "GA",
      postalCode: business.zip ?? undefined,
      addressCountry: "US",
    },
    ...(business.lat &&
      business.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: business.lat,
          longitude: business.lng,
        },
      }),
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: business.reviews.length,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{business.name}</h1>
            {business.verified && (
              <BadgeCheck className="size-6 text-primary" aria-label="Verificado" />
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={`/categoria/${business.category.slug}`}>
              <Badge variant="secondary">{business.category.nameEs}</Badge>
            </Link>
            {avgRating && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)} ({business.reviews.length})
              </span>
            )}
          </div>
          {(business.address || business.city) && (
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              {[business.address, business.city, business.state]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Globe className="size-4" /> {business.website}
            </a>
          )}
        </div>

        <div className="w-full md:w-80">
          <ClickActions
            businessSlug={business.slug}
            phone={business.phone}
            whatsapp={business.whatsapp}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Descripción */}
          {business.description && (
            <section>
              <h2 className="text-xl font-semibold">Acerca del negocio</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {business.description}
              </p>
            </section>
          )}

          {/* Reseñas */}
          <section>
            <h2 className="text-xl font-semibold">Reseñas</h2>
            {business.reviews.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                Este negocio aún no tiene reseñas.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {business.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{review.authorName}</p>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Formulario de contacto — El Puente */}
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Contactar</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm businessSlug={business.slug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
