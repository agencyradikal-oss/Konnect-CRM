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

/** Clientes del portafolio KMD Agency — fichas ACTIVE sin dueño. */
export const kmdPortfolioClients: KmdClient[] = [
  {
    slug: "aj-mountain-countertops",
    name: "AJ Mountain Countertops",
    description:
      "Fabricación e instalación de countertops de granito, cuarzo y mármol en el metro de Atlanta. Socio KMD Agency.",
    categorySlug: "countertops-piedra",
    city: "Atlanta",
    zip: "30301",
    plan: PlanEnum.PREMIUM,
    featured: true,
    verified: true,
  },
  {
    slug: "all-in-remodeling",
    name: "All In Remodeling",
    description:
      "Remodelación de cocinas, baños y proyectos residenciales. Socio KMD Agency.",
    categorySlug: "remodelacion-construccion",
    city: "Atlanta",
    zip: "30301",
    plan: PlanEnum.PREMIUM,
    featured: true,
    verified: true,
  },
  {
    slug: "anticruz-boards",
    name: "Anticruz Boards",
    description:
      "Tablas y productos de diseño. Identidad visual y presencia digital con KMD Agency.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "contigo-peru",
    name: "Contigo Peru",
    description:
      "Restaurante peruano. Sabores auténticos en Atlanta. Socio KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "cubicum",
    name: "Cubicum",
    description:
      "Diseño y marca. Proyectos de identidad y web con KMD Agency.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "edwards-hodges-law",
    name: "Edwards & Hodges Law",
    description:
      "Servicios legales. Presencia digital y marca con KMD Agency.",
    categorySlug: "legal",
    city: "Atlanta",
    zip: "30301",
    plan: PlanEnum.PRO,
    verified: true,
  },
  {
    slug: "ezzeta",
    name: "Ezzeta",
    description:
      "Producto y marca. Diseño y marketing con KMD Agency.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "fresco-cantina",
    name: "Fresco Cantina",
    description:
      "Cantina y cocina. Experiencia gastronómica en Atlanta. Socio KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "kjr-auto",
    name: "KJR Auto",
    description:
      "Servicios automotrices. Marca y marketing digital con KMD Agency.",
    categorySlug: "automotriz",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "la-mera-mera",
    name: "La Mera Mera",
    description:
      "Restaurante. Sabores mexicanos y presencia de marca con KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "moba-coffee-company",
    name: "Moba Coffee Company",
    description:
      "Café y experiencia. Branding y digital con KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "pmp-running",
    name: "PMP Running",
    description:
      "Running y comunidad. Identidad y campañas con KMD Agency.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "seis-hermanas-restaurant",
    name: "Seis Hermanas Restaurant",
    description:
      "Restaurante familiar. Marca y presencia digital con KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "talpa",
    name: "Talpa",
    description:
      "Restaurante. Experiencia culinaria y marketing con KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "the-coffee-store",
    name: "The Coffee Store",
    description:
      "Café y retail. Diseño de app/marca con KMD Agency.",
    categorySlug: "restaurantes",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "the-donas-cleaning",
    name: "The Doñas Cleaning",
    description:
      "Limpieza residencial y comercial. Marca y web con KMD Agency.",
    categorySlug: "limpieza",
    city: "Atlanta",
    zip: "30301",
    verified: true,
  },
  {
    slug: "dejavu-atlanta",
    name: "Dejavu Atlanta",
    description:
      "Retail Atlanta. Campañas y presencia digital con KMD Agency.",
    categorySlug: "marketing",
    city: "Atlanta",
    zip: "30301",
    verified: true,
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
        ...(data.plan !== undefined ? { plan: data.plan } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.verified !== undefined ? { verified: data.verified } : {}),
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
}
