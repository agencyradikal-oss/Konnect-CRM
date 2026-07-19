import type { Role } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export type ClerkPublicMeta = {
  konnectUserId?: string;
  role?: Role;
  businessId?: string | null;
  disabled?: boolean;
};

/** Escribe role/businessId/disabled en publicMetadata de Clerk (para JWT / UI). */
export async function syncClerkUserMetadata(params: {
  clerkUserId: string;
  konnectUserId: string;
  role: Role;
  businessId: string | null;
  disabled: boolean;
}) {
  const client = await clerkClient();
  await client.users.updateUserMetadata(params.clerkUserId, {
    publicMetadata: {
      konnectUserId: params.konnectUserId,
      role: params.role,
      businessId: params.businessId,
      disabled: params.disabled,
    } satisfies ClerkPublicMeta,
  });
}

/** Normaliza User de Clerk (SDK camelCase o webhook snake_case). */
export function normalizeClerkUser(raw: Record<string, unknown>) {
  const id = String(raw.id ?? "");
  const emailAddresses =
    (raw.emailAddresses as { emailAddress: string }[] | undefined) ??
    (
      raw.email_addresses as
        | { email_address: string }[]
        | undefined
    )?.map((e) => ({ emailAddress: e.email_address })) ??
    [];

  const firstName =
    (raw.firstName as string | null | undefined) ??
    (raw.first_name as string | null | undefined) ??
    null;
  const lastName =
    (raw.lastName as string | null | undefined) ??
    (raw.last_name as string | null | undefined) ??
    null;
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName =
    (typeof raw.fullName === "string" && raw.fullName.trim()) || joined || null;
  const banned = Boolean(raw.banned);

  return { id, emailAddresses, firstName, lastName, fullName, banned };
}

/**
 * Upsert User en Prisma a partir de un usuario Clerk.
 * Vincula por clerkUserId o email (migración de cuentas legacy).
 */
export async function upsertUserFromClerk(
  raw: Record<string, unknown> | { id: string },
  opts?: { sendWelcome?: boolean },
) {
  const clerkUser = normalizeClerkUser(raw as Record<string, unknown>);
  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase().trim();
  if (!email) {
    throw new Error("Usuario Clerk sin email primario.");
  }

  const name = clerkUser.fullName?.trim() || null;

  const existingByClerk = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });
  const existingByEmail = existingByClerk
    ? null
    : await prisma.user.findUnique({ where: { email } });

  const existing = existingByClerk ?? existingByEmail;
  const disabled = clerkUser.banned || Boolean(existing?.disabled);

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkUserId: clerkUser.id,
        email,
        name: name ?? existing.name,
        disabled,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email,
        name,
        role: "BUSINESS_OWNER",
        disabled,
      },
    });
    if (opts?.sendWelcome !== false) {
      void sendWelcomeEmail({ to: email, name: name ?? undefined }).catch((err) =>
        console.error("[clerk-sync] welcome email:", err),
      );
    }
  }

  await syncClerkUserMetadata({
    clerkUserId: clerkUser.id,
    konnectUserId: user.id,
    role: user.role,
    businessId: user.businessId,
    disabled: user.disabled,
  });

  return user;
}
