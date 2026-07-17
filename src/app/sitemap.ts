import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [businesses, categories] = await Promise.all([
    prisma.business.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, createdAt: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/directorio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/registrar-empresa`, changeFrequency: "monthly", priority: 0.6 },
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
}
