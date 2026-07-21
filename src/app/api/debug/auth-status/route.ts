import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

/** Debug-only: estado Clerk vs Prisma (sin secretos). */
export async function GET() {
  // #region agent log
  let clerkUserId: string | null = null;
  let prisma: {
    ok: boolean;
    role?: string;
    hasBusinessId?: boolean;
    disabled?: boolean;
  } | null = null;
  let error: string | null = null;
  try {
    const c = await clerkAuth();
    clerkUserId = c.userId;
    const session = await auth();
    if (session?.user) {
      prisma = {
        ok: true,
        role: session.user.role,
        hasBusinessId: Boolean(session.user.businessId),
      };
    } else {
      prisma = { ok: false };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown";
  }
  const payload = {
    clerkHasUserId: Boolean(clerkUserId),
    prisma,
    error,
  };
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
      location: "api/debug/auth-status/route.ts",
      message: "auth-status",
      data: payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return NextResponse.json(payload);
}
