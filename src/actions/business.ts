"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { auth, requireBusinessSession, unstable_update } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";

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

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

async function uploadImage(file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[blob] BLOB_READ_WRITE_TOKEN no configurado; upload omitido.");
    return null;
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera 4MB.");
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");

  const ext = file.name.split(".").pop() ?? "jpg";
  const blob = await put(`${prefix}-${Date.now()}.${ext}`, file, {
    access: "public",
  });
  return blob.url;
}

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

    let logoUrl: string | null = null;
    let coverUrl: string | null = null;
    try {
      logoUrl = await uploadImage(
        formData.get("logo") as File | null,
        `businesses/${slug}/logo`,
      );
      coverUrl = await uploadImage(
        formData.get("cover") as File | null,
        `businesses/${slug}/cover`,
      );
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Error subiendo imágenes. Puedes publicar sin fotos y subirlas después.",
      };
    }

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

    await unstable_update({ user: { businessId: business.id } });

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

  let logoUrl: string | null = null;
  let coverUrl: string | null = null;
  try {
    logoUrl = await uploadImage(
      formData.get("logo") as File | null,
      `businesses/${current.slug}/logo`
    );
    coverUrl = await uploadImage(
      formData.get("cover") as File | null,
      `businesses/${current.slug}/cover`
    );
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Error subiendo imágenes.",
    };
  }

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

/** Sube una foto a la galería respetando el límite del plan. */
export async function addGalleryImage(formData: FormData) {
  const { businessId } = await requireBusinessSession();
  const { getPlanLimits } = await import("@/lib/plans");

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

  try {
    const url = await uploadImage(
      formData.get("image") as File | null,
      `businesses/${business.slug}/gallery`,
    );
    if (!url) {
      return {
        ok: false as const,
        error: "No se pudo subir la imagen. Verifica BLOB_READ_WRITE_TOKEN.",
      };
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { gallery: { push: url } },
    });

    revalidatePath("/app/perfil");
    revalidatePath(`/negocio/${business.slug}`);
    return { ok: true as const, url };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Error subiendo imagen.",
    };
  }
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
