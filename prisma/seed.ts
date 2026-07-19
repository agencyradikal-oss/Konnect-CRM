import { PrismaClient, Plan, BusinessStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { slug: "remodelacion-construccion", nameEs: "Remodelación y Construcción", nameEn: "Remodeling & Construction", icon: "hammer" },
  { slug: "countertops-piedra", nameEs: "Countertops y Piedra", nameEn: "Countertops & Stone", icon: "layers" },
  { slug: "restaurantes", nameEs: "Restaurantes", nameEn: "Restaurants", icon: "utensils" },
  { slug: "salud", nameEs: "Salud", nameEn: "Health", icon: "heart-pulse" },
  { slug: "legal", nameEs: "Legal", nameEn: "Legal", icon: "scale" },
  { slug: "seguros", nameEs: "Seguros", nameEn: "Insurance", icon: "shield" },
  { slug: "real-estate", nameEs: "Real Estate", nameEn: "Real Estate", icon: "home" },
  { slug: "belleza", nameEs: "Belleza", nameEn: "Beauty", icon: "sparkles" },
  { slug: "automotriz", nameEs: "Automotriz", nameEn: "Automotive", icon: "car" },
  { slug: "limpieza", nameEs: "Limpieza", nameEn: "Cleaning", icon: "brush" },
  { slug: "marketing", nameEs: "Marketing", nameEn: "Marketing", icon: "megaphone" },
  { slug: "contabilidad-taxes", nameEs: "Contabilidad y Taxes", nameEn: "Accounting & Taxes", icon: "calculator" },
];

const hours = {
  mon: "9:00-18:00",
  tue: "9:00-18:00",
  wed: "9:00-18:00",
  thu: "9:00-18:00",
  fri: "9:00-18:00",
  sat: "10:00-14:00",
  sun: null,
};

type SeedBusiness = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  city: string;
  zip: string;
  address: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  plan?: Plan;
  featured?: boolean;
  verified?: boolean;
};

const businesses: SeedBusiness[] = [
  {
    slug: "granitos-el-aguila",
    name: "Granitos El Águila",
    description:
      "Fabricación e instalación de countertops de granito, cuarzo y mármol. Más de 15 años sirviendo al área metro de Atlanta. Medida y cotización gratis.",
    categorySlug: "countertops-piedra",
    city: "Norcross",
    zip: "30071",
    address: "1845 Beaver Ruin Rd",
    phone: "(770) 555-0134",
    whatsapp: "17705550134",
    email: "ventas@granitoselaguila.com",
    website: "https://granitoselaguila.com",
    plan: Plan.PREMIUM,
    featured: true,
    verified: true,
  },
  {
    slug: "remodelaciones-hernandez",
    name: "Remodelaciones Hernández",
    description:
      "Remodelación completa de cocinas, baños y sótanos. Licencia y seguro. Presupuestos sin compromiso en español o inglés.",
    categorySlug: "remodelacion-construccion",
    city: "Lawrenceville",
    zip: "30044",
    address: "735 Duluth Hwy",
    phone: "(678) 555-0192",
    whatsapp: "16785550192",
    email: "info@remodelacioneshernandez.com",
    plan: Plan.PRO,
    verified: true,
  },
  {
    slug: "taqueria-la-morena",
    name: "Taquería La Morena",
    description:
      "Auténticos tacos al pastor, birria y menudo los fines de semana. Catering para eventos y food truck disponible.",
    categorySlug: "restaurantes",
    city: "Buford",
    zip: "30518",
    address: "4300 Buford Dr",
    phone: "(470) 555-0177",
    email: "hola@lamorena.com",
    plan: Plan.FREE,
    verified: true,
  },
  {
    slug: "clinica-hispana-familiar",
    name: "Clínica Hispana Familiar",
    description:
      "Medicina general, exámenes escolares y físicos de trabajo. Atendemos sin cita y aceptamos pacientes sin aseguranza.",
    categorySlug: "salud",
    city: "Duluth",
    zip: "30096",
    address: "3790 Pleasant Hill Rd",
    phone: "(770) 555-0121",
    whatsapp: "17705550121",
    email: "citas@clinicahispanafamiliar.com",
    plan: Plan.PRO,
    verified: true,
  },
  {
    slug: "abogados-martinez-associates",
    name: "Martínez & Associates",
    description:
      "Abogados de inmigración, accidentes y derecho familiar. Consulta inicial gratuita. Hablamos español.",
    categorySlug: "legal",
    city: "Norcross",
    zip: "30093",
    address: "5855 Jimmy Carter Blvd",
    phone: "(678) 555-0155",
    email: "consultas@martinezlaw.com",
    website: "https://martinezlaw.com",
    plan: Plan.PREMIUM,
    featured: true,
    verified: true,
  },
  {
    slug: "seguros-la-confianza",
    name: "Seguros La Confianza",
    description:
      "Seguros de auto, casa, comercial y de vida. Cotizaciones al instante con las mejores tarifas del mercado.",
    categorySlug: "seguros",
    city: "Lawrenceville",
    zip: "30046",
    address: "129 W Pike St",
    phone: "(770) 555-0168",
    whatsapp: "17705550168",
    email: "cotiza@laconfianza.com",
    plan: Plan.FREE,
  },
  {
    slug: "casas-atlanta-realty",
    name: "Casas Atlanta Realty",
    description:
      "Compra y venta de casas en Gwinnett y alrededores. Programas para primeros compradores, pre-aprobación con ITIN.",
    categorySlug: "real-estate",
    city: "Suwanee",
    zip: "30024",
    address: "3651 Peachtree Pkwy",
    phone: "(404) 555-0143",
    email: "info@casasatlanta.com",
    website: "https://casasatlanta.com",
    plan: Plan.PRO,
    verified: true,
  },
  {
    slug: "bella-latina-salon",
    name: "Bella Latina Salón & Spa",
    description:
      "Cortes, color, keratina, uñas y maquillaje para toda ocasión. Citas por WhatsApp o llámanos.",
    categorySlug: "belleza",
    city: "Duluth",
    zip: "30097",
    address: "2131 Pleasant Hill Rd",
    phone: "(678) 555-0110",
    whatsapp: "16785550110",
    email: "citas@bellalatina.com",
    plan: Plan.FREE,
  },
  {
    slug: "taller-mecanico-el-primo",
    name: "Taller Mecánico El Primo",
    description:
      "Mecánica general, frenos, suspensión, diagnóstico computarizado y emisiones. Precios justos y trabajo garantizado.",
    categorySlug: "automotriz",
    city: "Buford",
    zip: "30519",
    address: "2955 Buford Hwy",
    phone: "(470) 555-0186",
    whatsapp: "14705550186",
    email: "taller@elprimo.com",
    plan: Plan.FREE,
    verified: true,
  },
  {
    slug: "limpieza-brillante",
    name: "Limpieza Brillante",
    description:
      "Limpieza residencial y comercial, deep cleaning y move-in/move-out. Personal de confianza, asegurado y con experiencia.",
    categorySlug: "limpieza",
    city: "Suwanee",
    zip: "30024",
    address: "1039 Peachtree Industrial Blvd",
    phone: "(770) 555-0129",
    whatsapp: "17705550129",
    email: "reservas@limpiezabrillante.com",
    plan: Plan.PRO,
  },
];

async function main() {
  console.log("Seeding categorías...");
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameEs: cat.nameEs, nameEn: cat.nameEn, icon: cat.icon },
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }

  console.log("Seeding negocios...");
  const businessIds: string[] = [];
  for (const biz of businesses) {
    const { categorySlug, ...data } = biz;
    const record = await prisma.business.upsert({
      where: { slug: biz.slug },
      update: {},
      create: {
        ...data,
        categoryId: categoryMap.get(categorySlug)!,
        state: "GA",
        hours,
        languages: ["es", "en"],
        status: BusinessStatus.ACTIVE,
        socials: { facebook: `https://facebook.com/${biz.slug}` },
      },
    });
    businessIds.push(record.id);
  }

  // Auth es Clerk: estas filas definen rol/tenant. Vincula al registrarte
  // en Clerk con el mismo email (o crea el usuario en el dashboard Clerk).
  console.log("Seeding usuarios (Prisma; login vía Clerk)...");
  const password = await bcrypt.hash("Konnect2026!", 10);

  await prisma.user.upsert({
    where: { email: "admin@kmd.agency" },
    update: {},
    create: {
      email: "admin@kmd.agency",
      name: "Super Admin",
      passwordHash: password,
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "dueno@granitoselaguila.com" },
    update: {},
    create: {
      email: "dueno@granitoselaguila.com",
      name: "Miguel Águila",
      passwordHash: password,
      role: Role.BUSINESS_OWNER,
      businessId: businessIds[0],
    },
  });

  await prisma.user.upsert({
    where: { email: "dueno@remodelacioneshernandez.com" },
    update: {},
    create: {
      email: "dueno@remodelacioneshernandez.com",
      name: "Carlos Hernández",
      passwordHash: password,
      role: Role.BUSINESS_OWNER,
      businessId: businessIds[1],
    },
  });

  console.log("Seed completo: 12 categorías, 10 negocios, 3 usuarios.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
