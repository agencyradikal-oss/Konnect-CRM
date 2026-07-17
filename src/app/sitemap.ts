import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// No prerender en build: requiere DATABASE_URL en runtime (Vercel).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/directorio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/registrar-empresa`, changeFrequency: "monthly", priority: 0.6 },
  ];

  if (!process.env.DATABASE_URL) {
    return staticEntries;
  }

  try {
    const [businesses, categories] = await Promise.all([
      prisma.business.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, createdAt: true },
      }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticEntries,
      ...categories.map((cat) => ({
        url: `${base}/categoria/${cat.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...businesses.map((biz) => ({
        url: `${base}/negocio/${biz.slug}`,
        lastModified: biz.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] No se pudo consultar la DB:", error);
    return staticEntries;
  }
}
