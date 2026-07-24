/** Respuestas tipadas de GET /api/auth/status (sin I/O). */

import type { ClerkFapiHealth } from "@/lib/clerk-fapi";
import { assessClerkFapiHealth } from "@/lib/clerk-fapi";

export type ClerkState = "missing" | "ok";
export type PrismaState = "skipped" | "ok" | "missing_user" | "error";

export type AuthStatusBody = {
  clerk: ClerkState;
  prisma: PrismaState;
  clerkHasUserId: boolean;
  prismaOk: boolean;
  role?: string;
  hasBusinessId?: boolean;
  error?: string;
  /** Diagnóstico FAPI vs proxy (sin secretos). */
  fapi?: ClerkFapiHealth;
};

function withFapi(body: AuthStatusBody): AuthStatusBody {
  return { ...body, fapi: assessClerkFapiHealth() };
}

export function authStatusNoClerk(): AuthStatusBody {
  return withFapi({
    clerk: "missing",
    prisma: "skipped",
    clerkHasUserId: false,
    prismaOk: false,
  });
}

export function authStatusOk(params: {
  role: string;
  hasBusinessId: boolean;
}): AuthStatusBody {
  return withFapi({
    clerk: "ok",
    prisma: "ok",
    clerkHasUserId: true,
    prismaOk: true,
    role: params.role,
    hasBusinessId: params.hasBusinessId,
  });
}

export function authStatusMissingUser(): AuthStatusBody {
  return withFapi({
    clerk: "ok",
    prisma: "missing_user",
    clerkHasUserId: true,
    prismaOk: false,
  });
}

export function authStatusPrismaError(message: string): AuthStatusBody {
  return withFapi({
    clerk: "ok",
    prisma: "error",
    clerkHasUserId: true,
    prismaOk: false,
    error: message,
  });
}
