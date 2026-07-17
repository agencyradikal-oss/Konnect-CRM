"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireBusinessSession } from "@/lib/auth";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const registerSchema = z.object({
  name: z.string().min(2, "Nombre del negocio requerido").max(120),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  city: z.string().min(1, "Ciudad requerida").max(80),
  phone: z.string().min(7, "Teléfono requerido").max(30),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export async function registerBusiness(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Inicia sesión primero." };
  if (session.user.businessId)
    return { ok: false as const, error: "Ya tienes un negocio registrado." };

  const data = registerSchema.parse(input);

  const base = slugify(data.name);
  let slug = base;
  for (let i = 2; await prisma.business.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const business = await prisma.business.create({
    data: {
      slug,
      name: data.name,
      categoryId: data.categoryId,
      city: data.city,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      description: data.description || null,
      status: "PENDING", // moderación por SUPER_ADMIN
      users: { connect: { id: session.user.id } },
    },
  });

  return { ok: true as const, slug: business.slug };
}

const profileSchema = z.object({
  description: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  zip: z.string().max(10).optional().or(z.literal("")),
});

export async function updateBusinessProfile(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = profileSchema.parse(input);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      description: data.description || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      website: data.website || null,
      address: data.address || null,
      city: data.city || null,
      zip: data.zip || null,
    },
  });

  revalidatePath("/app/perfil");
  return { ok: true as const };
}
