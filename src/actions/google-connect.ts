"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import {
  buildGoogleAuthUrl,
  isGoogleOAuthConfigured,
  revokeGoogleToken,
} from "@/lib/google/oauth";
import { decryptSecret } from "@/lib/crypto-secrets";

const STATE_COOKIE = "konnect_google_oauth_state";

export async function getGoogleConnectionStatus() {
  const { session, businessId } = await requireBusinessSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true },
  });
  const limits = getPlanLimits(business.plan);
  const conn = await prisma.googleConnection.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
    select: {
      googleAccountEmail: true,
      calendarEnabled: true,
      gbpEnabled: true,
      gbpLocationName: true,
      consentAt: true,
      updatedAt: true,
    },
  });

  return {
    configured: isGoogleOAuthConfigured(),
    planAllowsCalendar: limits.googleCalendar,
    planAllowsGbp: limits.googleBusinessProfile,
    planAllowsRoutes: limits.dayRoutes,
    planAllowsBooking: limits.publicBooking,
    connected: Boolean(conn),
    connection: conn,
  };
}

/** Inicia OAuth Google (Calendar; opcional GBP). Requiere consentimiento. */
export async function startGoogleConnect(input: unknown) {
  const data = z
    .object({
      consent: z.literal(true),
      includeGbp: z.boolean().optional(),
    })
    .parse(input);

  if (!isGoogleOAuthConfigured()) {
    return {
      ok: false as const,
      error: "Google OAuth no está configurado (GOOGLE_OAUTH_CLIENT_ID/SECRET).",
    };
  }

  const { session, businessId } = await requireBusinessSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true },
  });
  const limits = getPlanLimits(business.plan);
  if (!limits.googleCalendar) {
    return {
      ok: false as const,
      error: "Tu plan no incluye Google Calendar. Actualiza a Pro o Premium.",
    };
  }
  if (data.includeGbp && !limits.googleBusinessProfile) {
    return {
      ok: false as const,
      error: "Google Business Profile requiere plan Premium.",
    };
  }

  const state = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  jar.set(
    "konnect_google_oauth_meta",
    JSON.stringify({
      businessId,
      userId: session.user.id,
      includeGbp: Boolean(data.includeGbp),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );

  const url = buildGoogleAuthUrl({
    state,
    includeGbp: Boolean(data.includeGbp),
  });
  redirect(url);
}

export async function disconnectGoogle() {
  const { session, businessId } = await requireBusinessSession();
  const conn = await prisma.googleConnection.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });
  if (conn) {
    try {
      await revokeGoogleToken(decryptSecret(conn.refreshTokenEnc));
    } catch {
      /* ignore */
    }
    await prisma.googleConnection.delete({ where: { id: conn.id } });
  }
  revalidatePath("/app/integraciones");
  revalidatePath("/app/citas");
  return { ok: true as const };
}

export async function updateGoogleConnectionFlags(input: unknown) {
  const data = z
    .object({
      calendarEnabled: z.boolean().optional(),
      gbpEnabled: z.boolean().optional(),
      gbpLocationName: z.string().min(1).nullable().optional(),
    })
    .parse(input);

  const { session, businessId } = await requireBusinessSession();
  const conn = await prisma.googleConnection.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: session.user.id,
      },
    },
  });
  if (!conn) {
    return { ok: false as const, error: "Conecta Google primero." };
  }

  await prisma.googleConnection.update({
    where: { id: conn.id },
    data: {
      ...(data.calendarEnabled !== undefined && {
        calendarEnabled: data.calendarEnabled,
      }),
      ...(data.gbpEnabled !== undefined && { gbpEnabled: data.gbpEnabled }),
      ...(data.gbpLocationName !== undefined && {
        gbpLocationName: data.gbpLocationName,
      }),
    },
  });

  revalidatePath("/app/integraciones");
  return { ok: true as const };
}
