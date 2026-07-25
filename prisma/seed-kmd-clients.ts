import type { Plan, PrismaClient } from "@prisma/client";
import { BusinessStatus, Plan as PlanEnum } from "@prisma/client";

const hours = {
  mon: "9:00-18:00",
  tue: "9:00-18:00",
  wed: "9:00-18:00",
  thu: "9:00-18:00",
  fri: "9:00-18:00",
  sat: "10:00-14:00",
  sun: null,
};

type KmdClient = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  city: string;
  zip: string;
  address?: string;
  phone?: string;
  website?: string;
  plan?: Plan;
  featured?: boolean;
  verified?: boolean;
};

/** Fichas de directorio ACTIVE sin dueño (origen portafolio; copy público neutro). */
export const kmdPortfolioClients: KmdClient[] = [
  {
    slug: "all-in-remodeling",
    name: "All In Remodeling",
    description:
      "Remodelación de cocinas, baños y proyectos residenciales en el metro de Atlanta.",
    categorySlug: "remodelacion-construccion",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "anticruz-boards",
    name: "Anticruz Boards",
    description: "Tablas y productos de diseño en Atlanta.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "contigo-peru",
    name: "Contigo Peru",
    description: "Restaurante peruano en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "cubicum",
    name: "Cubicum",
    description: "Diseño y marca en Atlanta.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "edwards-hodges-law",
    name: "Edwards & Hodges Law",
    description: "Servicios legales en Atlanta.",
    categorySlug: "legal",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "ezzeta",
    name: "Ezzeta",
    description: "Producto y marca en Atlanta.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "fresco-cantina",
    name: "Fresco Cantina",
    description: "Cantina y cocina en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "kjr-auto",
    name: "KJR Auto",
    description: "Servicios automotrices en Atlanta.",
    categorySlug: "automotriz",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "la-mera-mera",
    name: "La Mera Mera",
    description: "Restaurante de cocina mexicana en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "moba-coffee-company",
    name: "Moba Coffee Company",
    description: "Café en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "pmp-running",
    name: "PMP Running",
    description: "Running y comunidad en Atlanta.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "seis-hermanas-restaurant",
    name: "Seis Hermanas Restaurant",
    description: "Restaurante familiar en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "talpa",
    name: "Talpa",
    description: "Restaurante en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "the-coffee-store",
    name: "The Coffee Store",
    description: "Café y retail en Atlanta.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "the-donas-cleaning",
    name: "The Doñas Cleaning",
    description: "Limpieza residencial y comercial en Atlanta.",
    categorySlug: "limpieza",
    city: "Atlanta",
    zip: "30301",
  },
  {
    slug: "dejavu-atlanta",
    name: "Dejavu Atlanta",
    description: "Retail en Atlanta.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
  },
];

export async function seedKmdClients(
  prisma: PrismaClient,
  categoryMap: Map<string, string>,
) {
  console.log("Seeding clientes KMD (portafolio)...");
  for (const biz of kmdPortfolioClients) {
    const categoryId = categoryMap.get(biz.categorySlug);
    if (!categoryId) {
      console.warn(`[seed-kmd] categoría faltante: ${biz.categorySlug}`);
      continue;
    }
    const { categorySlug: _c, ...data } = biz;
    await prisma.business.upsert({
      where: { slug: biz.slug },
      // No pisar claimEmail / claimedAt / dueños si ya existen.
      update: {
        name: data.name,
        description: data.description,
        categoryId,
        city: data.city,
        zip: data.zip,
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        // Neutro en directorio: sin badges de socio / featured por defecto.
        plan: data.plan ?? PlanEnum.FREE,
        featured: data.featured ?? false,
        verified: data.verified ?? false,
        status: BusinessStatus.ACTIVE,
      },
      create: {
        slug: biz.slug,
        name: data.name,
        description: data.description,
        categoryId,
        city: data.city,
        zip: data.zip,
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        state: "GA",
        hours,
        languages: ["es", "en"],
        status: BusinessStatus.ACTIVE,
        plan: data.plan ?? PlanEnum.FREE,
        featured: data.featured ?? false,
        verified: data.verified ?? false,
      },
    });
  }

  // AJ Mountain: perfil personal, no seed de portafolio.
  await prisma.business.deleteMany({
    where: { slug: "aj-mountain-countertops", claimedAt: null },
  });
}
