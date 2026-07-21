import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

/** Estado mínimo Clerk vs Prisma (sin secretos ni PII). */
export async function GET() {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      return NextResponse.json({
        clerkHasUserId: false,
        prisma: { ok: false },
      });
    }
    const session = await auth();
    return NextResponse.json({
      clerkHasUserId: true,
      prisma: session?.user
        ? {
            ok: true,
            role: session.user.role,
            hasBusinessId: Boolean(session.user.businessId),
          }
        : { ok: false },
    });
  } catch (e) {
    return NextResponse.json(
      {
        clerkHasUserId: false,
        prisma: { ok: false },
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
