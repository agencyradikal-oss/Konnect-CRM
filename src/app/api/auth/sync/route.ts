import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fuerza sync Prisma ← Clerk cuando ya hay userId en la sesión. */
export async function POST() {
  try {
    const session = await auth();
    return NextResponse.json({
      ok: Boolean(session?.user),
      hasBusinessId: Boolean(session?.user?.businessId),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
