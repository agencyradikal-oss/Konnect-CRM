"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireBusinessSession } from "@/lib/auth";
import { syncClerkUserMetadata } from "@/lib/clerk-sync";
import { geocodeAddress } from "@/lib/geocode";
import {
  normalizeSocialUrl,
  normalizeWebsiteUrl,
  socialsForDb,
} from "@/lib/business-socials";
import { normalizeClaimEmail } from "@/lib/business-claim";
import { normalizeWeekHours } from "@/lib/hours";

/** Solo acepta URLs del store Blob de Vercel (subidas vía /api/blob/upload). */
function parseBlobUrl(raw: FormDataEntryValue | null): string | null {
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

function formStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

const wizardSchema = z.object({
  // Paso 1
  name: z.string().min(2, "Nombre del negocio requerido").max(120),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().max(2000).optional().or(z.literal("")),
  languages: z.array(z.enum(["es", "en"])).min(1, "Selecciona al menos un idioma"),
  // Paso 2
  phone: z.string().min(7, "Teléfono requerido").max(30),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "Ciudad requerida").max(80),
  zip: z.string().max(10).optional().or(z.literal("")),
  // Paso 3
  hours: hoursSchema,
});

/** Wizard de registro: crea Business PENDING y asigna businessId al usuario. */
export async function registerBusinessFull(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false as const, error: "Inicia sesión primero." };
    }

    // Preferir DB por si el JWT está desfasado tras un intento previo.
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true },
    });
    if (dbUser?.businessId || session.user.businessId) {
      return { ok: false as const, error: "Ya tienes un negocio registrado." };
    }

    if (session.user.email) {
      const claimEmail = normalizeClaimEmail(session.user.email);
      const pendingClaim = await prisma.business.findFirst({
        where: {
          claimEmail,
          claimedAt: null,
          claimTokenHash: { not: null },
          users: { none: { role: "BUSINESS_OWNER" } },
        },
        select: { name: true, claimTokenExpiresAt: true },
      });
      if (
        pendingClaim &&
        pendingClaim.claimTokenExpiresAt &&
        pendingClaim.claimTokenExpiresAt.getTime() > Date.now()
      ) {
        return {
          ok: false as const,
          error: `Ya tienes un negocio para reclamar («${pendingClaim.name}»). Abre el enlace de la invitación por email en lugar de registrar uno nuevo.`,
        };
      }
    }

    let data;
    try {
      data = wizardSchema.parse({
        name: formData.get("name"),
        categoryId: formData.get("categoryId"),
        description: formData.get("description") ?? "",
        languages: JSON.parse(String(formData.get("languages") ?? "[]")),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp") ?? "",
        email: formData.get("email") ?? "",
        address: formData.get("address") ?? "",
        city: formData.get("city"),
        zip: formData.get("zip") ?? "",
        hours: JSON.parse(String(formData.get("hours") ?? "{}")),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          ok: false as const,
          error: error.issues[0]?.message ?? "Datos inválidos.",
        };
      }
      return { ok: false as const, error: "Datos inválidos." };
    }

    const slug = await uniqueSlug(data.name);

    const coords = await geocodeAddress({
      address: data.address,
      city: data.city,
      zip: data.zip,
    });

    const logoUrl = parseBlobUrl(formData.get("logoUrl"));
    const coverUrl = parseBlobUrl(formData.get("coverUrl"));

    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          slug,
          name: data.name,
          categoryId: data.categoryId,
          description: data.description || null,
          languages: data.languages,
          phone: data.phone,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city,
          zip: data.zip || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          logoUrl,
          coverUrl,
          hours: data.hours,
          status: "PENDING",
        },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { businessId: created.id, role: "BUSINESS_OWNER" },
      });
      return created;
    });

    const linked = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clerkUserId: true, role: true, disabled: true },
    });
    if (linked?.clerkUserId) {
      await syncClerkUserMetadata({
        clerkUserId: linked.clerkUserId,
        konnectUserId: session.user.id,
        role: linked.role,
        businessId: business.id,
        disabled: linked.disabled,
      });
    }

    const ownerEmail = session.user.email;
    if (ownerEmail) {
      const { applyCourtesyForUserBusiness } = await import(
        "@/lib/plan-courtesy"
      );
      await applyCourtesyForUserBusiness(prisma, {
        email: ownerEmail,
        businessId: business.id,
      }).catch((err) =>
        console.error("[registerBusinessFull] plan courtesy:", err),
      );
    }

    return { ok: true as const, slug: business.slug };
  } catch (error) {
    console.error("[registerBusinessFull]", error);
    const message = error instanceof Error ? error.message : "";
    if (/body exceed|body size|too large/i.test(message)) {
      return {
        ok: false as const,
        error:
          "Las imágenes son demasiado grandes. Quítalas o usa archivos más pequeños y vuelve a intentar.",
      };
    }
    return {
      ok: false as const,
      error: "No se pudo registrar el negocio. Intenta de nuevo.",
    };
  }
}

const profileSchema = wizardSchema.extend({
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

const zStr = z.preprocess((v) => (v == null ? "" : v), z.string());
const zStrOpt = z.preprocess((v) => (v == null ? "" : v), z.string());

const profileUpdateInputSchema = z.object({
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
  zip: zStrOpt,
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

function coerceProfilePayload(input: unknown): Record<string, unknown> {
  if (typeof FormData !== "undefined" && input instanceof FormData) {
    let hours: unknown = {};
    try {
      hours = JSON.parse(String(input.get("hours") ?? "{}"));
    } catch {
      hours = {};
    }
    let socials: unknown = {};
    try {
      socials = JSON.parse(String(input.get("socials") ?? "{}"));
    } catch {
      socials = {};
    }
    let languages: unknown = ["es"];
    try {
      languages = JSON.parse(String(input.get("languages") ?? '["es"]'));
    } catch {
      languages = ["es"];
    }
    return {
      name: formStr(input, "name"),
      categoryId: formStr(input, "categoryId"),
      description: formStr(input, "description"),
      languages,
      phone: formStr(input, "phone"),
      whatsapp: formStr(input, "whatsapp"),
      email: formStr(input, "email"),
      website: formStr(input, "website"),
      address: formStr(input, "address"),
      city: formStr(input, "city"),
      zip: formStr(input, "zip"),
      hours,
      socials,
      logoUrl: formStr(input, "logoUrl") || null,
      coverUrl: formStr(input, "coverUrl") || null,
    };
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return { ...(input as Record<string, unknown>) };
  }
  return {};
}

/** Edición completa del perfil público desde /app/perfil. */
export async function updateBusinessProfile(input: unknown) {
  const { businessId } = await requireBusinessSession();

  const current = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { slug: true, address: true, city: true, zip: true, lat: true },
  });

  const coerced = coerceProfilePayload(input);

  const rawParsed = profileUpdateInputSchema.safeParse(coerced);
  if (!rawParsed.success) {
    const first = rawParsed.error.issues[0];
    const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
    return {
      ok: false as const,
      error: `${path}${first?.message ?? "Datos inválidos."}`,
    };
  }

  const raw = rawParsed.data;
  const hoursNormalized = normalizeWeekHours(raw.hours);

  const websiteNormalized = normalizeWebsiteUrl(raw.website);
  if (websiteNormalized === null) {
    return { ok: false as const, error: "website: URL inválida." };
  }

  let data;
  try {
    data = profileSchema.parse({
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
      zip: raw.zip,
      hours: hoursNormalized,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
      return {
        ok: false as const,
        error: `${path}${first?.message ?? "Datos inválidos."}`,
      };
    }
    return { ok: false as const, error: "Datos inválidos." };
  }

  const socialsRaw = raw.socials ?? {};
  for (const [k, v] of Object.entries(socialsRaw)) {
    if (typeof v === "string" && v.trim() && !normalizeSocialUrl(v)) {
      return { ok: false as const, error: `URL de ${k} inválida.` };
    }
  }
  const socials = socialsForDb(socialsRaw);

  const locationChanged =
    data.address !== (current.address ?? "") ||
    data.city !== (current.city ?? "") ||
    data.zip !== (current.zip ?? "") ||
    current.lat === null;

  try {
    const coords = locationChanged
      ? await geocodeAddress({
          address: data.address,
          city: data.city,
          zip: data.zip,
        })
      : null;

    const logoUrl = parseBlobUrl(raw.logoUrl ?? null);
    const coverUrl = parseBlobUrl(raw.coverUrl ?? null);

    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description || null,
        languages: data.languages,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city,
        zip: data.zip || null,
        hours: data.hours,
        socials: socials ?? Prisma.DbNull,
        ...(coords && { lat: coords.lat, lng: coords.lng }),
        ...(logoUrl && { logoUrl }),
        ...(coverUrl && { coverUrl }),
      },
    });
  } catch (error) {
    console.error("[updateBusinessProfile]", error);
    return {
      ok: false as const,
      error: "No se pudo guardar el perfil. Intenta de nuevo.",
    };
  }

  revalidatePath("/app/perfil");
  revalidatePath(`/negocio/${current.slug}`);
  revalidatePath("/directorio");

  return { ok: true as const };
}

/** Guarda en galería una URL ya subida a Blob (vía /api/blob/upload). */
export async function addGalleryImage(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const { getPlanLimits } = await import("@/lib/plans");
  const { url: rawUrl } = z.object({ url: z.string().url() }).parse(input);
  const url = parseBlobUrl(rawUrl);
  if (!url) {
    return { ok: false as const, error: "URL de imagen inválida." };
  }

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { slug: true, plan: true, gallery: true },
  });

  const limits = getPlanLimits(business.plan);
  if (business.gallery.length >= limits.galleryPhotos) {
    return {
      ok: false as const,
      error: `Tu plan permite hasta ${limits.galleryPhotos} foto${limits.galleryPhotos === 1 ? "" : "s"} en la galería. Actualiza tu plan para agregar más.`,
    };
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { gallery: { push: url } },
  });

  revalidatePath("/app/perfil");
  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const, url };
}

export async function removeGalleryImage(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const { url } = z.object({ url: z.string().url() }).parse(input);

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { slug: true, gallery: true },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { gallery: business.gallery.filter((u) => u !== url) },
  });

  revalidatePath("/app/perfil");
  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const };
}
