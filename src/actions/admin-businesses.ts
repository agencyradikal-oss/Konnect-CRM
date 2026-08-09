"use server";

import { z } from "zod";
import { Prisma, BusinessStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";
import {
  normalizeSocialUrl,
  normalizeWebsiteUrl,
  socialsForDb,
} from "@/lib/business-socials";
import { normalizeWeekHours } from "@/lib/hours";

function parseBlobUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (!u.hostname.endsWith(".blob.vercel-storage.com")) return null;
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function uniqueSlug(name: string) {
  const base = slugify(name) || "negocio";
  let slug = base;
  for (let i = 2; await prisma.business.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

const daySchema = z.object({
  open: z.string().default("09:00"),
  close: z.string().default("18:00"),
  closed: z.boolean().default(false),
});

const hoursSchema = z.record(z.string(), daySchema);

const adminBusinessFieldsSchema = z.object({
  name: z.string().min(2, "Nombre del negocio requerido").max(120),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().max(2000).optional().or(z.literal("")),
  languages: z.array(z.enum(["es", "en"])).min(1, "Selecciona al menos un idioma"),
  phone: z.string().min(7, "Teléfono requerido").max(30),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "Ciudad requerida").max(80),
  state: z.string().min(1, "Estado requerido").max(40),
  country: z.string().min(1, "País requerido").max(80),
  zip: z.string().max(10).optional().or(z.literal("")),
  hours: hoursSchema,
});

const zStr = z.preprocess((v) => (v == null ? "" : v), z.string());
const zStrOpt = z.preprocess((v) => (v == null ? "" : v), z.string());

const adminBusinessInputSchema = z.object({
  name: zStr,
  categoryId: zStr,
  description: zStrOpt,
  languages: z.array(z.string()).default(["es"]),
  phone: zStr,
  whatsapp: zStrOpt,
  email: zStrOpt,
  website: zStrOpt,
  address: zStrOpt,
  city: zStr,
  state: zStr,
  country: zStr,
  zip: zStrOpt,
  slug: zStrOpt,
  hours: z.unknown(),
  socials: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional()
    .default({}),
  logoUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
});

function zodErrorMessage(error: z.ZodError) {
  const first = error.issues[0];
  const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
  return `${path}${first?.message ?? "Datos inválidos."}`;
}

function parseAdminBusinessInput(input: unknown) {
  const rawParsed = adminBusinessInputSchema.safeParse(input);
  if (!rawParsed.success) {
    return { ok: false as const, error: zodErrorMessage(rawParsed.error) };
  }

  const raw = rawParsed.data;
  const websiteNormalized = normalizeWebsiteUrl(raw.website);
  if (websiteNormalized === null) {
    return { ok: false as const, error: "website: URL inválida." };
  }

  const socialsRaw = raw.socials ?? {};
  for (const [k, v] of Object.entries(socialsRaw)) {
    if (typeof v === "string" && v.trim() && !normalizeSocialUrl(v)) {
      return { ok: false as const, error: `URL de ${k} inválida.` };
    }
  }

  try {
    const data = adminBusinessFieldsSchema.parse({
      name: raw.name,
      categoryId: raw.categoryId,
      description: raw.description,
      languages: raw.languages,
      phone: raw.phone,
      whatsapp: raw.whatsapp,
      email: raw.email,
      website: websiteNormalized,
      address: raw.address,
      city: raw.city,
      state: raw.state.trim() || "GA",
      country: raw.country.trim() || "US",
      zip: raw.zip,
      hours: normalizeWeekHours(raw.hours),
    });
    return {
      ok: true as const,
      data,
      slugRaw: raw.slug,
      socials: socialsForDb(socialsRaw),
      logoUrl: parseBlobUrl(raw.logoUrl ?? null),
      coverUrl: parseBlobUrl(raw.coverUrl ?? null),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: zodErrorMessage(error) };
    }
    return { ok: false as const, error: "Datos inválidos." };
  }
}

function revalidateBusinessPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/negocios");
  revalidatePath("/admin/reclamos");
  revalidatePath("/admin/usuarios");
  revalidatePath("/directorio");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/negocio/${slug}`);
}

/** Crea una ficha ACTIVE del directorio (sin dueño). */
export async function createBusinessAsAdmin(input: unknown) {
  await requireSuperAdmin();

  const parsed = parseAdminBusinessInput(input);
  if (!parsed.ok) return parsed;

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true },
  });
  if (!category) {
    return { ok: false as const, error: "Categoría no encontrada." };
  }

  try {
    const coords = await geocodeAddress({
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      country: parsed.data.country,
    });
    const slug = await uniqueSlug(parsed.data.name);

    const business = await prisma.business.create({
      data: {
        slug,
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description || null,
        languages: parsed.data.languages,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        address: parsed.data.address || null,
        city: parsed.data.city,
        zip: parsed.data.zip || null,
        state: parsed.data.state,
        country: parsed.data.country,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        hours: parsed.data.hours,
        socials: parsed.socials ?? Prisma.DbNull,
        logoUrl: parsed.logoUrl,
        coverUrl: parsed.coverUrl,
        status: BusinessStatus.ACTIVE,
        plan: "FREE",
      },
    });

    revalidateBusinessPaths(business.slug);
    return { ok: true as const, id: business.id, slug: business.slug };
  } catch (error) {
    console.error("[createBusinessAsAdmin]", error);
    return {
      ok: false as const,
      error: "No se pudo crear el negocio. Intenta de nuevo.",
    };
  }
}

/** Edita una ficha del directorio desde el panel admin. */
export async function updateBusinessAsAdmin(input: unknown) {
  await requireSuperAdmin();

  const withId = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!withId.success) {
    return { ok: false as const, error: "Negocio no encontrado." };
  }

  const parsed = parseAdminBusinessInput(input);
  if (!parsed.ok) return parsed;

  const current = await prisma.business.findUnique({
    where: { id: withId.data.id },
    select: {
      id: true,
      slug: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zip: true,
      lat: true,
    },
  });
  if (!current) {
    return { ok: false as const, error: "Negocio no encontrado." };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true },
  });
  if (!category) {
    return { ok: false as const, error: "Categoría no encontrada." };
  }

  const nextSlug = slugify(parsed.slugRaw || current.slug);
  if (nextSlug.length < 2 || nextSlug.length > 80) {
    return {
      ok: false as const,
      error: "slug: Usa letras, números y guiones (mínimo 2).",
    };
  }
  if (nextSlug !== current.slug) {
    const taken = await prisma.business.findFirst({
      where: { slug: nextSlug, id: { not: current.id } },
      select: { id: true },
    });
    if (taken) {
      return { ok: false as const, error: "Ese slug ya está en uso." };
    }
  }

  const locationChanged =
    parsed.data.address !== (current.address ?? "") ||
    parsed.data.city !== (current.city ?? "") ||
    parsed.data.state !== (current.state ?? "") ||
    parsed.data.country !== (current.country ?? "") ||
    parsed.data.zip !== (current.zip ?? "") ||
    current.lat === null;

  try {
    const coords = locationChanged
      ? await geocodeAddress({
          address: parsed.data.address,
          city: parsed.data.city,
          state: parsed.data.state,
          zip: parsed.data.zip,
          country: parsed.data.country,
        })
      : null;

    await prisma.business.update({
      where: { id: current.id },
      data: {
        name: parsed.data.name,
        slug: nextSlug,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description || null,
        languages: parsed.data.languages,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        address: parsed.data.address || null,
        city: parsed.data.city,
        state: parsed.data.state,
        country: parsed.data.country,
        zip: parsed.data.zip || null,
        hours: parsed.data.hours,
        socials: parsed.socials ?? Prisma.DbNull,
        ...(coords && { lat: coords.lat, lng: coords.lng }),
        ...(parsed.logoUrl && { logoUrl: parsed.logoUrl }),
        ...(parsed.coverUrl && { coverUrl: parsed.coverUrl }),
      },
    });

    if (nextSlug !== current.slug) {
      revalidateBusinessPaths(current.slug);
    }
    revalidateBusinessPaths(nextSlug);
    revalidatePath(`/admin/negocios/${current.id}`);
    return { ok: true as const, slug: nextSlug };
  } catch (error) {
    console.error("[updateBusinessAsAdmin]", error);
    return {
      ok: false as const,
      error: "No se pudo guardar el negocio. Intenta de nuevo.",
    };
  }
}

/** Publica o suspende una ficha (no usa PENDING). */
export async function setBusinessStatusAsAdmin(input: unknown) {
  await requireSuperAdmin();
  const data = z
    .object({
      businessId: z.string().min(1),
      status: z.enum(["ACTIVE", "SUSPENDED"]),
    })
    .parse(input);

  const business = await prisma.business.update({
    where: { id: data.businessId },
    data: { status: data.status },
    select: { slug: true },
  });

  revalidateBusinessPaths(business.slug);
  return { ok: true as const };
}
