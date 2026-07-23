/** Respuestas tipadas de GET /api/auth/status (sin I/O). */

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
};

export function authStatusNoClerk(): AuthStatusBody {
  return {
    clerk: "missing",
    prisma: "skipped",
    clerkHasUserId: false,
    prismaOk: false,
  };
}

export function authStatusOk(params: {
  role: string;
  hasBusinessId: boolean;
}): AuthStatusBody {
  return {
    clerk: "ok",
    prisma: "ok",
    clerkHasUserId: true,
    prismaOk: true,
    role: params.role,
    hasBusinessId: params.hasBusinessId,
  };
}

export function authStatusMissingUser(): AuthStatusBody {
  return {
    clerk: "ok",
    prisma: "missing_user",
    clerkHasUserId: true,
    prismaOk: false,
  };
}

export function authStatusPrismaError(message: string): AuthStatusBody {
  return {
    clerk: "ok",
    prisma: "error",
    clerkHasUserId: true,
    prismaOk: false,
    error: message,
  };
}
