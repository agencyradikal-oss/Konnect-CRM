"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { syncClerkUserMetadata } from "@/lib/clerk-sync";
import { sanitizeUserText } from "@/lib/sanitize";

function revalidateAdminUsers() {
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}

const roleSchema = z.nativeEnum(Role);

async function syncClerkForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.clerkUserId) return;
  await syncClerkUserMetadata({
    clerkUserId: user.clerkUserId,
    konnectUserId: user.id,
    role: user.role,
    businessId: user.businessId,
    disabled: user.disabled,
  });
}

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
  await syncClerkForUser(data.userId);

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
  await syncClerkForUser(data.userId);

  revalidateAdminUsers();
  return { ok: true as const };
}

/** Activa o desactiva el acceso (login) — ban en Clerk + flag Prisma. */
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

  if (target.clerkUserId) {
    const client = await clerkClient();
    if (data.disabled) {
      await client.users.banUser(target.clerkUserId);
    } else {
      await client.users.unbanUser(target.clerkUserId);
    }
    await syncClerkForUser(data.userId);
  }

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

/** Crea usuario en Clerk + Prisma desde el panel. */
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
  const email = data.email.toLowerCase().trim();
  const name = sanitizeUserText(data.name, 120);

  const existing = await prisma.user.findUnique({ where: { email } });
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

  const businessId =
    data.role === "SUPER_ADMIN" ? null : data.businessId || null;

  const client = await clerkClient();
  let clerkUser;
  try {
    clerkUser = await client.users.createUser({
      emailAddress: [email],
      password: data.password,
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ").slice(1).join(" ") || undefined,
      skipPasswordChecks: false,
    });
  } catch (err) {
    console.error("[createAdminUser] Clerk:", err);
    return {
      ok: false as const,
      error: "No se pudo crear el usuario en Clerk. Revisa el email/contraseña.",
    };
  }

  const user = await prisma.user.create({
    data: {
      clerkUserId: clerkUser.id,
      name,
      email,
      role: data.role,
      businessId,
    },
  });

  await syncClerkUserMetadata({
    clerkUserId: clerkUser.id,
    konnectUserId: user.id,
    role: user.role,
    businessId: user.businessId,
    disabled: false,
  });

  revalidateAdminUsers();
  return { ok: true as const };
}

const passwordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8).max(100),
});

/** Restablece la contraseña en Clerk (solo admin). */
export async function resetUserPassword(input: unknown) {
  await requireSuperAdmin();
  const data = passwordSchema.parse(input);

  const target = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado." };
  if (!target.clerkUserId) {
    return {
      ok: false as const,
      error: "Este usuario aún no está vinculado a Clerk.",
    };
  }

  const client = await clerkClient();
  try {
    await client.users.updateUser(target.clerkUserId, {
      password: data.password,
    });
  } catch (err) {
    console.error("[resetUserPassword] Clerk:", err);
    return {
      ok: false as const,
      error: "No se pudo actualizar la contraseña en Clerk.",
    };
  }

  revalidateAdminUsers();
  return { ok: true as const };
}
