"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireBusinessSession } from "@/lib/auth";
import { syncClerkUserMetadata } from "@/lib/clerk-sync";
import { geocodeAddress } from "@/lib/geocode";

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
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const hoursSchema = z.record(z.string(), daySchema);

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

/** Edición completa del perfil público desde /app/perfil. */
export async function updateBusinessProfile(formData: FormData) {
  const { businessId } = await requireBusinessSession();

  const current = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { slug: true, address: true, city: true, zip: true, lat: true },
  });

  let data;
  try {
    data = profileSchema.parse({
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      description: formData.get("description") ?? "",
      languages: JSON.parse(String(formData.get("languages") ?? "[]")),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp") ?? "",
      email: formData.get("email") ?? "",
      website: formData.get("website") ?? "",
      address: formData.get("address") ?? "",
      city: formData.get("city"),
      zip: formData.get("zip") ?? "",
      hours: JSON.parse(String(formData.get("hours") ?? "{}")),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Datos inválidos." };
    }
    return { ok: false as const, error: "Datos inválidos." };
  }

  // Re-geocodificar solo si cambió la ubicación (o nunca se geocodificó)
  const locationChanged =
    data.address !== (current.address ?? "") ||
    data.city !== (current.city ?? "") ||
    data.zip !== (current.zip ?? "") ||
    current.lat === null;
  const coords = locationChanged
    ? await geocodeAddress({ address: data.address, city: data.city, zip: data.zip })
    : null;

  const logoUrl = parseBlobUrl(formData.get("logoUrl"));
  const coverUrl = parseBlobUrl(formData.get("coverUrl"));

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
      ...(coords && { lat: coords.lat, lng: coords.lng }),
      ...(logoUrl && { logoUrl }),
      ...(coverUrl && { coverUrl }),
    },
  });

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
