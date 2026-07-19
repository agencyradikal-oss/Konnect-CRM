import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

// No prerender en build: requiere DATABASE_URL en runtime (Vercel).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/directorio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/precios`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/como-funciona`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/developers`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/eliminar-datos`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/registrar-empresa`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return staticEntries;
    }

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
    console.error("[sitemap] No se pudo generar el sitemap completo:", error);
    return staticEntries;
  }
}
