import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth";
import {
  authStatusMissingUser,
  authStatusNoClerk,
  authStatusOk,
  authStatusPrismaError,
} from "@/lib/auth-status";

export const runtime = "nodejs";

/**
 * Estado mínimo Clerk vs Prisma (sin secretos ni PII).
 * `prisma: skipped` cuando no hay sesión Clerk — no confundir con DB caída.
 */
export async function GET() {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      return NextResponse.json(authStatusNoClerk());
    }

    try {
      const session = await auth();
      if (session?.user) {
        return NextResponse.json(
          authStatusOk({
            role: session.user.role,
            hasBusinessId: Boolean(session.user.businessId),
          }),
        );
      }
      return NextResponse.json(authStatusMissingUser());
    } catch (e) {
      return NextResponse.json(
        authStatusPrismaError(e instanceof Error ? e.message : "unknown"),
        { status: 500 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      {
        ...authStatusNoClerk(),
        prisma: "error" as const,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
