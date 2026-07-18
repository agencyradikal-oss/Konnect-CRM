"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { sanitizeUserText } from "@/lib/sanitize";

function revalidateAdminUsers() {
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}

const roleSchema = z.nativeEnum(Role);

/** Actualiza rol de un usuario. No permite quitar el último SUPER_ADMIN activo. */
export async function updateUserRole(input: unknown) {
  await requireSuperAdmin();
  const data = z
    .object({
      userId: z.string().min(1),
      role: roleSchema,
    })
    .parse(input);

  const target = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado." };

  if (target.role === "SUPER_ADMIN" && data.role !== "SUPER_ADMIN") {
    const admins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", disabled: false, id: { not: target.id } },
    });
    if (admins === 0) {
      return {
        ok: false as const,
        error: "Debe quedar al menos un SUPER_ADMIN activo.",
      };
    }
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: { role: data.role },
  });

  revalidateAdminUsers();
  return { ok: true as const };
}

/** Asigna o quita el tenant (negocio) del usuario. */
export async function assignUserBusiness(input: unknown) {
  await requireSuperAdmin();
  const data = z
    .object({
      userId: z.string().min(1),
      businessId: z.string().min(1).nullable(),
    })
    .parse(input);

  if (data.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { id: true },
    });
    if (!biz) return { ok: false as const, error: "Negocio no encontrado." };
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: { businessId: data.businessId },
  });

  revalidateAdminUsers();
  return { ok: true as const };
}

/** Activa o desactiva el acceso (login). */
export async function setUserDisabled(input: unknown) {
  const session = await requireSuperAdmin();
  const data = z
    .object({
      userId: z.string().min(1),
      disabled: z.boolean(),
    })
    .parse(input);

  if (data.userId === session.user?.id && data.disabled) {
    return { ok: false as const, error: "No puedes desactivarte a ti mismo." };
  }

  const target = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado." };

  if (target.role === "SUPER_ADMIN" && data.disabled) {
    const admins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", disabled: false, id: { not: target.id } },
    });
    if (admins === 0) {
      return {
        ok: false as const,
        error: "Debe quedar al menos un SUPER_ADMIN activo.",
      };
    }
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: { disabled: data.disabled },
  });

  revalidateAdminUsers();
  return { ok: true as const };
}

const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: roleSchema,
  businessId: z.string().min(1).optional().nullable(),
});

/** Crea un usuario (staff/dueño/admin) desde el panel. */
export async function createAdminUser(input: unknown) {
  await requireSuperAdmin();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    return { ok: false as const, error: "Ese email ya está registrado." };
  }

  if (data.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { id: true },
    });
    if (!biz) return { ok: false as const, error: "Negocio no encontrado." };
  }

  if (
    (data.role === "BUSINESS_OWNER" || data.role === "BUSINESS_STAFF") &&
    !data.businessId
  ) {
    return {
      ok: false as const,
      error: "Asigna un negocio a dueños y staff.",
    };
  }

  await prisma.user.create({
    data: {
      name: sanitizeUserText(data.name, 120),
      email: data.email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      businessId: data.role === "SUPER_ADMIN" ? null : data.businessId || null,
    },
  });

  revalidateAdminUsers();
  return { ok: true as const };
}

const passwordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8).max(100),
});

/** Restablece la contraseña de un usuario (solo admin). */
export async function resetUserPassword(input: unknown) {
  await requireSuperAdmin();
  const data = passwordSchema.parse(input);

  const target = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado." };

  await prisma.user.update({
    where: { id: data.userId },
    data: { passwordHash: await bcrypt.hash(data.password, 10) },
  });

  revalidateAdminUsers();
  return { ok: true as const };
}
