import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Globe, MapPin, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { ContactForm } from "@/components/directory/contact-form";
import { ClickActions } from "@/components/directory/click-actions";
import { ProfileViewTracker } from "@/components/directory/profile-view-tracker";
import { ReviewForm } from "@/components/directory/review-form";
import {
  DirectoryNav,
  breadcrumbJsonLd,
} from "@/components/directory/directory-nav";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getBusiness(slug: string) {
  try {
    return await prisma.business.findUnique({
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
  } catch (error) {
    console.error("[negocio] Database unavailable:", error);
    return null;
  }
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
    alternates: { canonical: `/negocio/${business.slug}` },
    openGraph: {
      title: business.name,
      description: business.description?.slice(0, 155),
      type: "website",
      ...(business.coverUrl || business.logoUrl
        ? { images: [{ url: business.coverUrl || business.logoUrl! }] }
        : {}),
    },
  };
}

export default async function NegocioPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("directory");
  const business = await getBusiness(slug);
  if (!business || business.status !== "ACTIVE") notFound();

  const avgRating =
    business.reviews.length > 0
      ? business.reviews.reduce((sum, r) => sum + r.rating, 0) /
        business.reviews.length
      : null;

  const baseUrl = getAppBaseUrl();
  const categoryHref = `/categoria/${business.category.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description ?? undefined,
    url: `${baseUrl}/negocio/${business.slug}`,
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
    ...(business.logoUrl || business.coverUrl
      ? { image: business.logoUrl || business.coverUrl || undefined }
      : {}),
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: business.reviews.length,
      },
    }),
  };

  const crumbsLd = breadcrumbJsonLd(baseUrl, [
    { name: t("home"), path: "/" },
    { name: t("title"), path: "/directorio" },
    { name: business.category.nameEs, path: categoryHref },
    { name: business.name, path: `/negocio/${business.slug}` },
  ]);

  const gallery = business.gallery.slice(0, 10);
  const hasClickActions = Boolean(business.phone || business.whatsapp);

  return (
    <div className={hasClickActions ? "pb-24 lg:pb-0" : undefined}>
      {business.coverUrl ? (
        <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64 md:h-72">
          <Image
            src={business.coverUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <ProfileViewTracker slug={business.slug} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }}
        />

        <DirectoryNav
          backHref={categoryHref}
          items={[
            { label: t("home"), href: "/" },
            { label: t("title"), href: "/directorio" },
            { label: business.category.nameEs, href: categoryHref },
            { label: business.name },
          ]}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            {business.logoUrl ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-background shadow-sm sm:size-24">
                <Image
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
                  {business.name}
                </h1>
                {business.verified && (
                  <BadgeCheck
                    className="mt-1 size-5 shrink-0 text-primary sm:size-6"
                    aria-label="Verificado"
                  />
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link href={categoryHref}>
                  <Badge variant="secondary">{business.category.nameEs}</Badge>
                </Link>
                {business.featured && (
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                    Destacado
                  </Badge>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} ({business.reviews.length})
                  </span>
                )}
              </div>
              {(business.address || business.city) && (
                <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="break-words">
                    {[business.address, business.city, business.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe className="size-4 shrink-0" />
                  <span className="truncate">{business.website}</span>
                </a>
              )}
            </div>
          </div>

          <div className="hidden w-full lg:block lg:w-80">
            <ClickActions
              businessSlug={business.slug}
              phone={business.phone}
              whatsapp={business.whatsapp}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            {business.description && (
              <section>
                <h2 className="text-xl font-semibold">Acerca del negocio</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {business.description}
                </p>
              </section>
            )}

            {gallery.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold">Galería</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {gallery.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={url}
                        alt={`${business.name} — foto ${i + 1}`}
                        fill
                        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 200px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate font-medium">
                            {review.authorName}
                          </p>
                          <span className="flex shrink-0 items-center gap-1 text-sm">
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
              <ReviewForm businessSlug={business.slug} />
            </section>
          </div>

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

      {hasClickActions && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden">
          <div className="mx-auto max-w-6xl">
            <ClickActions
              businessSlug={business.slug}
              phone={business.phone}
              whatsapp={business.whatsapp}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
