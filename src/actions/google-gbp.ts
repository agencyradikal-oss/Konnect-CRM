"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import {
  listGbpAccounts,
  listGbpLocations,
  patchGbpLocation,
} from "@/lib/google/gbp";
import {
  buildMultiStopMapsUrl,
  formatAddressLine,
  orderStopsNearestNeighbor,
} from "@/lib/google/maps";

export async function optimizeDayRoute(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = z
    .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .parse(input);

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      plan: true,
      lat: true,
      lng: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });
  if (!getPlanLimits(business.plan).dayRoutes) {
    return { ok: false as const, error: "Requiere plan Premium." };
  }

  const dayStart = new Date(`${data.date}T00:00:00`);
  const dayEnd = new Date(`${data.date}T23:59:59.999`);

  const appts = await prisma.appointment.findMany({
    where: {
      businessId,
      status: "SCHEDULED",
      startsAt: { gte: dayStart, lte: dayEnd },
    },
  });

  const start =
    typeof business.lat === "number" && typeof business.lng === "number"
      ? { lat: business.lat, lng: business.lng }
      : null;

  const ordered = orderStopsNearestNeighbor(appts, start);

  await prisma.$transaction(
    ordered.map((a, index) =>
      prisma.appointment.update({
        where: { id: a.id },
        data: { routeOrder: index },
      }),
    ),
  );

  const stops = ordered
    .map((a) =>
      formatAddressLine({
        address: a.address,
        city: a.city,
        state: a.state,
        zip: a.zip,
      }),
    )
    .filter(Boolean);

  const mapsUrl = buildMultiStopMapsUrl(stops);

  revalidatePath("/app/ruta");
  return {
    ok: true as const,
    orderedIds: ordered.map((a) => a.id),
    mapsUrl,
  };
}

export async function listGbpLocationsForConnect() {
  const { session, businessId } = await requireBusinessSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true },
  });
  if (!getPlanLimits(business.plan).googleBusinessProfile) {
    return { ok: false as const, error: "Requiere plan Premium.", locations: [] };
  }

  const token = await getValidGoogleAccessToken({
    businessId,
    userId: session.user.id,
  });
  if (!token) {
    return { ok: false as const, error: "Conecta Google primero.", locations: [] };
  }

  const accounts = await listGbpAccounts(token.accessToken);
  const locations: { name: string; title?: string }[] = [];
  for (const acc of accounts.slice(0, 5)) {
    const locs = await listGbpLocations(token.accessToken, acc.name);
    locations.push(...locs);
  }
  return { ok: true as const, locations };
}

export async function syncBusinessToGbp() {
  const { session, businessId } = await requireBusinessSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });
  if (!getPlanLimits(business.plan).googleBusinessProfile) {
    return { ok: false as const, error: "Requiere plan Premium." };
  }

  const token = await getValidGoogleAccessToken({
    businessId,
    userId: session.user.id,
  });
  if (!token?.connection.gbpEnabled || !token.connection.gbpLocationName) {
    return {
      ok: false as const,
      error: "Activa GBP y selecciona una ubicación en Integraciones.",
    };
  }

  const result = await patchGbpLocation(
    token.accessToken,
    token.connection.gbpLocationName,
    {
      title: business.name,
      phone: business.phone,
      website: business.website,
      description: business.description?.slice(0, 750) ?? null,
    },
  );

  revalidatePath("/app/integraciones");
  return result;
}
