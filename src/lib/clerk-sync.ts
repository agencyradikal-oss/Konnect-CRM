import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

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

type ClerkEmailRow = {
  emailAddress: string;
  id?: string;
};

/** Normaliza User de Clerk (SDK camelCase o webhook snake_case). */
export function normalizeClerkUser(raw: Record<string, unknown>) {
  const id = String(raw.id ?? "");
  const emailAddresses: ClerkEmailRow[] =
    (raw.emailAddresses as ClerkEmailRow[] | undefined) ??
    (
      raw.email_addresses as
        | { email_address: string; id?: string }[]
        | undefined
    )?.map((e) => ({ emailAddress: e.email_address, id: e.id })) ??
    [];

  const primaryEmailAddressId =
    (raw.primaryEmailAddressId as string | null | undefined) ??
    (raw.primary_email_address_id as string | null | undefined) ??
    null;

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

  return {
    id,
    emailAddresses,
    primaryEmailAddressId,
    firstName,
    lastName,
    fullName,
    banned,
  };
}

function primaryEmail(clerkUser: ReturnType<typeof normalizeClerkUser>) {
  const list = clerkUser.emailAddresses;
  if (clerkUser.primaryEmailAddressId) {
    const primary = list.find((e) => e.id === clerkUser.primaryEmailAddressId);
    if (primary?.emailAddress) {
      return primary.emailAddress.toLowerCase().trim();
    }
  }
  return list[0]?.emailAddress?.toLowerCase().trim() ?? null;
}

/**
 * Upsert User en Prisma a partir de un usuario Clerk.
 * Vincula por clerkUserId o email (migración de cuentas legacy).
 * Tolerante a carreras paralelas de auth() (P2002 en email/clerkUserId).
 */
export async function upsertUserFromClerk(
  raw: Record<string, unknown> | { id: string },
  opts?: { sendWelcome?: boolean },
) {
  const clerkUser = normalizeClerkUser(raw as Record<string, unknown>);
  const email = primaryEmail(clerkUser);
  if (!email) {
    throw new Error("Usuario Clerk sin email primario.");
  }

  const name = clerkUser.fullName?.trim() || null;

  async function findExisting() {
    const byClerk = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });
    if (byClerk) return { user: byClerk, via: "clerk" as const };
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return { user: byEmail, via: "email" as const };
    return null;
  }

  const existing = await findExisting();
  const disabled = clerkUser.banned || Boolean(existing?.user.disabled);
  let linkPath: "update" | "create" | "create-race-retry" = existing
    ? "update"
    : "create";
  let user;

  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.user.id },
      data: {
        clerkUserId: clerkUser.id,
        email,
        name: name ?? existing.user.name,
        disabled,
      },
    });
  } else {
    try {
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
        void sendWelcomeEmail({
          to: email,
          name: name ?? undefined,
        }).catch((err) => console.error("[clerk-sync] welcome email:", err));
      }
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // #region agent log
      fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "11ae6f",
        },
        body: JSON.stringify({
          sessionId: "11ae6f",
          runId: "post-fix",
          hypothesisId: "F",
          location: "clerk-sync.ts:create-race",
          message: "upsert-create-unique-violation-retry",
          data: {
            targets: (error as Prisma.PrismaClientKnownRequestError).meta
              ?.target,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const raced = await findExisting();
      if (!raced) throw error;
      linkPath = "create-race-retry";
      user = await prisma.user.update({
        where: { id: raced.user.id },
        data: {
          clerkUserId: clerkUser.id,
          email,
          name: name ?? raced.user.name,
          disabled: clerkUser.banned || Boolean(raced.user.disabled),
        },
      });
    }
  }

  // #region agent log
  fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "11ae6f",
    },
    body: JSON.stringify({
      sessionId: "11ae6f",
      runId: "post-fix",
      hypothesisId: "F",
      location: "clerk-sync.ts:upsert-ok",
      message: "upsert-user-ok",
      data: {
        linkPath,
        via: existing?.via ?? null,
        hasBusinessId: Boolean(user.businessId),
        role: user.role,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  await syncClerkUserMetadata({
    clerkUserId: clerkUser.id,
    konnectUserId: user.id,
    role: user.role,
    businessId: user.businessId,
    disabled: user.disabled,
  });

  return user;
}
