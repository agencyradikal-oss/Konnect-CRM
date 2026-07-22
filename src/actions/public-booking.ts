"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { geocodeAddress } from "@/lib/geocode";
import {
  buildDirectionsUrl,
  formatAddressLine,
} from "@/lib/google/maps";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import {
  createCalendarEvent,
  queryFreeBusy,
} from "@/lib/google/calendar";
import { sanitizeUserText } from "@/lib/sanitize";

const bookingSchema = z.object({
  businessSlug: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7).max(40),
  address: z.string().min(3).max(300),
  city: z.string().min(2).max(120),
  zip: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(240).default(60),
});

/** Slots libres aproximados (próximos 7 días, 9–17 ET) para booking Premium. */
export async function getPublicBookingSlots(businessSlug: string) {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug, status: "ACTIVE" },
    select: { id: true, plan: true },
  });
  if (!business || !getPlanLimits(business.plan).publicBooking) {
    return { ok: false as const, slots: [] as string[] };
  }

  const owner = await prisma.user.findFirst({
    where: { businessId: business.id, role: "BUSINESS_OWNER", disabled: false },
    select: { id: true },
  });
  if (!owner) return { ok: true as const, slots: [] as string[] };

  const token = await getValidGoogleAccessToken({
    businessId: business.id,
    userId: owner.id,
  });

  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const busy = token
    ? await queryFreeBusy(token.accessToken, now, horizon)
    : [];

  const slots: string[] = [];
  for (let d = 1; d <= 7; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const hour of [9, 11, 14, 16]) {
      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      if (start <= now) continue;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const overlaps = busy.some((b) => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return start.getTime() < be && end.getTime() > bs;
      });
      if (!overlaps) slots.push(start.toISOString());
    }
  }

  return { ok: true as const, slots: slots.slice(0, 24) };
}

/** Booking público → Lead BOOKING + Appointment (+ Calendar si conectado). */
export async function createPublicBooking(input: unknown) {
  const data = bookingSchema.parse(input);
  const business = await prisma.business.findUnique({
    where: { slug: data.businessSlug, status: "ACTIVE" },
    include: {
      users: {
        where: { role: "BUSINESS_OWNER", disabled: false },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!business) {
    return { ok: false as const, error: "Negocio no encontrado." };
  }
  if (!getPlanLimits(business.plan).publicBooking) {
    return {
      ok: false as const,
      error: "Este negocio no tiene reserva online activa.",
    };
  }

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(
    startsAt.getTime() + data.durationMinutes * 60 * 1000,
  );
  const name = sanitizeUserText(data.name, 120);
  const phone = data.phone.trim();
  const address = sanitizeUserText(data.address, 300);
  const city = sanitizeUserText(data.city, 120);

  const coords = await geocodeAddress({
    address,
    city,
    state: "GA",
    zip: data.zip,
  });
  const dest = formatAddressLine({
    address,
    city,
    state: "GA",
    zip: data.zip,
  });
  const origin = formatAddressLine({
    address: business.address,
    city: business.city,
    state: business.state,
    zip: business.zip,
  });
  const mapsUrl = buildDirectionsUrl({
    destination: dest,
    origin: origin || undefined,
  });

  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name,
      email: data.email || null,
      phone,
      message: [
        `Reserva online: ${startsAt.toLocaleString("es-US")}`,
        `Dirección: ${dest}`,
        data.notes ? `Notas: ${data.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      source: "BOOKING",
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      createdByUserId: business.users[0]?.id ?? null,
      type: "MEASURE",
      title: `Medida — ${name}`,
      notes: data.notes?.trim() || null,
      startsAt,
      endsAt,
      address,
      city,
      state: "GA",
      zip: data.zip?.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      mapsUrl,
    },
  });

  const ownerId = business.users[0]?.id;
  if (ownerId) {
    const token = await getValidGoogleAccessToken({
      businessId: business.id,
      userId: ownerId,
    });
    if (token?.connection.calendarEnabled) {
      try {
        const ev = await createCalendarEvent(token.accessToken, {
          summary: appointment.title,
          description: `Cliente: ${name}\nTel: ${phone}\n${data.notes ?? ""}`,
          location: dest,
          start: startsAt,
          end: endsAt,
          appointmentId: appointment.id,
        });
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            googleEventId: ev.eventId,
            googleCalendarId: ev.calendarId,
          },
        });
      } catch (err) {
        console.error("[public booking] calendar:", err);
      }
    }
  }

  revalidatePath(`/negocio/${business.slug}`);
  return { ok: true as const, appointmentId: appointment.id };
}
