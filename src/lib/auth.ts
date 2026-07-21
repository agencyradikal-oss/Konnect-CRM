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
  if (!userId) {
    // #region agent log
    fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "11ae6f",
      },
      body: JSON.stringify({
        sessionId: "11ae6f",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "lib/auth.ts:no-clerk",
        message: "auth-null-no-clerk-user",
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
  }

  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  let linkedViaUpsert = false;

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      // #region agent log
      fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "11ae6f",
        },
        body: JSON.stringify({
          sessionId: "11ae6f",
          runId: "pre-fix",
          hypothesisId: "C",
          location: "lib/auth.ts:no-currentUser",
          message: "auth-null-clerk-without-currentUser",
          data: { hasClerkUserId: true },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return null;
    }
    dbUser = await upsertUserFromClerk(
      clerkUser as unknown as Record<string, unknown>,
      { sendWelcome: true },
    );
    linkedViaUpsert = true;
  }

  if (dbUser.disabled) {
    // #region agent log
    fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "11ae6f",
      },
      body: JSON.stringify({
        sessionId: "11ae6f",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "lib/auth.ts:disabled",
        message: "auth-null-user-disabled",
        data: { linkedViaUpsert },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
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
      runId: "pre-fix",
      hypothesisId: "C",
      location: "lib/auth.ts:ok",
      message: "auth-session-ok",
      data: {
        linkedViaUpsert,
        role: dbUser.role,
        hasBusinessId: Boolean(dbUser.businessId),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
