import type { Role } from "@prisma/client";
import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { upsertUserFromClerk } from "@/lib/clerk-sync";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  businessId: string | null;
};

export type AppSession = {
  user: SessionUser;
};

/**
 * Sesión Konnect (Prisma) a partir de la sesión Clerk.
 * Compatible con el shape anterior de Auth.js: `{ user: { id, email, name, role, businessId } }`.
 */
export async function auth(): Promise<AppSession | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;
    dbUser = await upsertUserFromClerk(
      clerkUser as unknown as Record<string, unknown>,
      { sendWelcome: true },
    );
  }

  if (dbUser.disabled) return null;

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      businessId: dbUser.businessId,
    },
  };
}

/** No-op: la sesión siempre lee role/businessId desde Prisma (compat. Auth.js). */
export async function unstable_update(_data?: unknown) {
  return null;
}

/** Sesión con businessId garantizado — para Server Actions del CRM. */
export async function requireBusinessSession() {
  const { getCurrentBusiness } = await import("@/lib/tenant");
  const { session, businessId } = await getCurrentBusiness();
  return { session, businessId };
}

/** Sesión SUPER_ADMIN — para el panel /admin. */
export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("No autorizado: se requiere SUPER_ADMIN.");
  }
  return session;
}
