import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto-secrets";
import {
  exchangeGoogleCode,
  fetchGoogleUserEmail,
} from "@/lib/google/oauth";
import { getAppBaseUrl } from "@/lib/app-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "konnect_google_oauth_state";
const META_COOKIE = "konnect_google_oauth_meta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const base = getAppBaseUrl();

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const metaRaw = jar.get(META_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  jar.delete(META_COOKIE);

  if (error) {
    return NextResponse.redirect(
      `${base}/app/integraciones?google=error&reason=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state || !expectedState || state !== expectedState || !metaRaw) {
    return NextResponse.redirect(
      `${base}/app/integraciones?google=error&reason=invalid_state`,
    );
  }

  let meta: { businessId: string; userId: string; includeGbp?: boolean };
  try {
    meta = JSON.parse(metaRaw) as typeof meta;
  } catch {
    return NextResponse.redirect(
      `${base}/app/integraciones?google=error&reason=bad_meta`,
    );
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${base}/app/integraciones?google=error&reason=no_refresh_token`,
      );
    }

    const email = await fetchGoogleUserEmail(tokens.access_token);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
    const scopes = (tokens.scope ?? "").split(/\s+/).filter(Boolean);

    await prisma.googleConnection.upsert({
      where: {
        businessId_userId: {
          businessId: meta.businessId,
          userId: meta.userId,
        },
      },
      create: {
        businessId: meta.businessId,
        userId: meta.userId,
        googleAccountEmail: email,
        accessTokenEnc: encryptSecret(tokens.access_token),
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        expiresAt,
        scopes,
        calendarEnabled: true,
        gbpEnabled: Boolean(meta.includeGbp),
        consentAt: new Date(),
      },
      update: {
        googleAccountEmail: email,
        accessTokenEnc: encryptSecret(tokens.access_token),
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        expiresAt,
        scopes,
        calendarEnabled: true,
        gbpEnabled: Boolean(meta.includeGbp),
        consentAt: new Date(),
      },
    });

    return NextResponse.redirect(`${base}/app/integraciones?google=connected`);
  } catch (err) {
    console.error("[google oauth callback]", err);
    return NextResponse.redirect(
      `${base}/app/integraciones?google=error&reason=exchange_failed`,
    );
  }
}
