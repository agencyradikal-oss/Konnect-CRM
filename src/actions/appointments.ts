"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, AppointmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { geocodeAddress } from "@/lib/geocode";
import {
  buildDirectionsUrl,
  formatAddressLine,
} from "@/lib/google/maps";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/google/calendar";

function revalidateAppointments() {
  revalidatePath("/app/citas");
  revalidatePath("/app/ruta");
  revalidatePath("/app/dashboard");
}

const appointmentSchema = z.object({
  type: z.nativeEnum(AppointmentType).default("MEASURE"),
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  timezone: z.string().default("America/New_York"),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(40).optional(),
  zip: z.string().max(20).optional(),
  contactId: z.string().min(1).optional().nullable(),
  dealId: z.string().min(1).optional().nullable(),
  leadId: z.string().min(1).optional().nullable(),
  syncCalendar: z.boolean().optional().default(true),
});

async function assertCalendarPlan(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true, address: true, city: true, state: true, zip: true },
  });
  const limits = getPlanLimits(business.plan);
  return { business, limits };
}

export async function createAppointment(input: unknown) {
  const { session, businessId } = await requireBusinessSession();
  const data = appointmentSchema.parse(input);
  const { business, limits } = await assertCalendarPlan(businessId);

  if (!limits.googleCalendar) {
    // Allow creating appointments without Google on Free? Plan says Free without OAuth.
    // Still allow local CRM appointments for all plans — only Calendar sync gated.
  }

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (endsAt <= startsAt) {
    return { ok: false as const, error: "La hora de fin debe ser posterior al inicio." };
  }

  const coords = await geocodeAddress({
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
  });

  const dest = formatAddressLine({
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
  });
  const origin = formatAddressLine({
    address: business.address,
    city: business.city,
    state: business.state,
    zip: business.zip,
  });
  const mapsUrl = dest
    ? buildDirectionsUrl({
        destination: dest,
        origin: origin || undefined,
      })
    : null;

  const appointment = await prisma.appointment.create({
    data: {
      businessId,
      createdByUserId: session.user.id,
      type: data.type,
      title: data.title.trim(),
      notes: data.notes?.trim() || null,
      startsAt,
      endsAt,
      timezone: data.timezone,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || "GA",
      zip: data.zip?.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      mapsUrl,
      contactId: data.contactId || null,
      dealId: data.dealId || null,
      leadId: data.leadId || null,
    },
  });

  if (data.syncCalendar && limits.googleCalendar) {
    const token = await getValidGoogleAccessToken({
      businessId,
      userId: session.user.id,
    });
    if (token?.connection.calendarEnabled) {
      try {
        const ev = await createCalendarEvent(token.accessToken, {
          summary: appointment.title,
          description: appointment.notes ?? undefined,
          location: dest || undefined,
          start: startsAt,
          end: endsAt,
          timezone: appointment.timezone,
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
        console.error("[createAppointment] calendar sync:", err);
      }
    }
  }

  if (data.dealId) {
    await prisma.activity.create({
      data: {
        businessId,
        dealId: data.dealId,
        type: "note",
        content: `Cita agendada: ${appointment.title} (${startsAt.toLocaleString("es-US")})`,
      },
    }).catch(() => undefined);
  }

  revalidateAppointments();
  return { ok: true as const, id: appointment.id, mapsUrl };
}

export async function updateAppointment(input: unknown) {
  const { session, businessId } = await requireBusinessSession();
  const data = appointmentSchema
    .partial()
    .extend({
      id: z.string().min(1),
      status: z.nativeEnum(AppointmentStatus).optional(),
    })
    .parse(input);

  const existing = await prisma.appointment.findFirst({
    where: { id: data.id, businessId },
  });
  if (!existing) {
    return { ok: false as const, error: "Cita no encontrada." };
  }

  const { business, limits } = await assertCalendarPlan(businessId);

  const startsAt = data.startsAt ? new Date(data.startsAt) : existing.startsAt;
  const endsAt = data.endsAt ? new Date(data.endsAt) : existing.endsAt;

  let lat = existing.lat;
  let lng = existing.lng;
  let mapsUrl = existing.mapsUrl;
  if (
    data.address !== undefined ||
    data.city !== undefined ||
    data.state !== undefined ||
    data.zip !== undefined
  ) {
    const address = data.address ?? existing.address;
    const city = data.city ?? existing.city;
    const state = data.state ?? existing.state;
    const zip = data.zip ?? existing.zip;
    const coords = await geocodeAddress({ address, city, state, zip });
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
    const dest = formatAddressLine({ address, city, state, zip });
    const origin = formatAddressLine({
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
    });
    mapsUrl = dest
      ? buildDirectionsUrl({ destination: dest, origin: origin || undefined })
      : null;
  }

  const updated = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.title && { title: data.title.trim() }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.status && { status: data.status }),
      startsAt,
      endsAt,
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.address !== undefined && { address: data.address?.trim() || null }),
      ...(data.city !== undefined && { city: data.city?.trim() || null }),
      ...(data.state !== undefined && { state: data.state?.trim() || null }),
      ...(data.zip !== undefined && { zip: data.zip?.trim() || null }),
      lat,
      lng,
      mapsUrl,
    },
  });

  if (
    limits.googleCalendar &&
    updated.googleEventId &&
    data.syncCalendar !== false
  ) {
    const token = await getValidGoogleAccessToken({
      businessId,
      userId: session.user.id,
    });
    if (token?.connection.calendarEnabled) {
      try {
        if (updated.status === "CANCELED") {
          await deleteCalendarEvent(
            token.accessToken,
            updated.googleEventId,
            updated.googleCalendarId ?? "primary",
          );
          await prisma.appointment.update({
            where: { id: updated.id },
            data: { googleEventId: null, googleCalendarId: null },
          });
        } else {
          await updateCalendarEvent(
            token.accessToken,
            updated.googleEventId,
            {
              summary: updated.title,
              description: updated.notes ?? undefined,
              location: formatAddressLine({
                address: updated.address,
                city: updated.city,
                state: updated.state,
                zip: updated.zip,
              }),
              start: updated.startsAt,
              end: updated.endsAt,
              timezone: updated.timezone,
            },
            updated.googleCalendarId ?? "primary",
          );
        }
      } catch (err) {
        console.error("[updateAppointment] calendar sync:", err);
      }
    }
  }

  revalidateAppointments();
  return { ok: true as const };
}

export async function cancelAppointment(input: unknown) {
  return updateAppointment({
    ...z.object({ id: z.string().min(1) }).parse(input),
    status: "CANCELED",
  });
}

export async function reorderDayRoute(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      orderedIds: z.array(z.string().min(1)).min(1),
    })
    .parse(input);

  const { limits } = await assertCalendarPlan(businessId);
  if (!limits.dayRoutes) {
    return {
      ok: false as const,
      error: "La ruta del día requiere plan Premium.",
    };
  }

  const dayStart = new Date(`${data.date}T00:00:00.000Z`);
  const dayEnd = new Date(`${data.date}T23:59:59.999Z`);

  const appts = await prisma.appointment.findMany({
    where: {
      businessId,
      status: "SCHEDULED",
      startsAt: { gte: dayStart, lte: dayEnd },
      id: { in: data.orderedIds },
    },
    select: { id: true },
  });
  const allowed = new Set(appts.map((a) => a.id));

  await prisma.$transaction(
    data.orderedIds
      .filter((id) => allowed.has(id))
      .map((id, index) =>
        prisma.appointment.update({
          where: { id },
          data: { routeOrder: index },
        }),
      ),
  );

  revalidatePath("/app/ruta");
  return { ok: true as const };
}
