import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

type ClerkState = "missing" | "ok";
type PrismaState = "skipped" | "ok" | "missing_user" | "error";

/**
 * Estado mínimo Clerk vs Prisma (sin secretos ni PII).
 * `prisma: skipped` cuando no hay sesión Clerk — no confundir con DB caída.
 */
export async function GET() {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      return NextResponse.json({
        clerk: "missing" as ClerkState,
        prisma: "skipped" as PrismaState,
        clerkHasUserId: false,
        prismaOk: false,
      });
    }

    try {
      const session = await auth();
      if (session?.user) {
        return NextResponse.json({
          clerk: "ok" as ClerkState,
          prisma: "ok" as PrismaState,
          clerkHasUserId: true,
          prismaOk: true,
          role: session.user.role,
          hasBusinessId: Boolean(session.user.businessId),
        });
      }
      return NextResponse.json({
        clerk: "ok" as ClerkState,
        prisma: "missing_user" as PrismaState,
        clerkHasUserId: true,
        prismaOk: false,
      });
    } catch (e) {
      return NextResponse.json(
        {
          clerk: "ok" as ClerkState,
          prisma: "error" as PrismaState,
          clerkHasUserId: true,
          prismaOk: false,
          error: e instanceof Error ? e.message : "unknown",
        },
        { status: 500 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      {
        clerk: "missing" as ClerkState,
        prisma: "error" as PrismaState,
        clerkHasUserId: false,
        prismaOk: false,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
