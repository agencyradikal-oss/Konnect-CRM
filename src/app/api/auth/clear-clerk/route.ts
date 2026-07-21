import { NextResponse, type NextRequest } from "next/server";
import { expireClerkCookiesOnResponse } from "@/lib/clerk-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Borra cookies Clerk incluyendo HttpOnly (__session).
 * document.cookie NO puede borrarlas; sin esto queda
 * session-token-but-no-client-uat → handshake loop.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  return expireClerkCookiesOnResponse(res, req);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
