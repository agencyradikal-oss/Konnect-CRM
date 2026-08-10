"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  AppointmentStatus,
  AppointmentType,
  type DealStage,
  TaskStatus,
} from "@prisma/client";
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

export type AppointmentDetail = {
  id: string;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  mapsUrl: string | null;
  googleEventId: string | null;
  contactId: string | null;
  dealId: string | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    notes: string | null;
  } | null;
  deal: {
    id: string;
    title: string;
    value: number | null;
    stage: DealStage;
    notes: string | null;
    tasks: { id: string; title: string; dueDate: string | null }[];
    activities: {
      id: string;
      type: string;
      content: string;
      createdAt: string;
    }[];
  } | null;
};

export async function getAppointmentDetail(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Cita no encontrada." };
  }

  const row = await prisma.appointment.findFirst({
    where: { id: parsed.data.id, businessId },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          company: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          notes: true,
        },
      },
      deal: {
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          notes: true,
          tasks: {
            where: { status: { not: TaskStatus.DONE } },
            orderBy: { dueDate: "asc" },
            take: 5,
            select: { id: true, title: true, dueDate: true },
          },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, type: true, content: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!row) {
    return { ok: false as const, error: "Cita no encontrada." };
  }

  const appointment: AppointmentDetail = {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    notes: row.notes,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    mapsUrl: row.mapsUrl,
    googleEventId: row.googleEventId,
    contactId: row.contactId,
    dealId: row.dealId,
    contact: row.contact,
    deal: row.deal
      ? {
          id: row.deal.id,
          title: row.deal.title,
          value: row.deal.value != null ? Number(row.deal.value) : null,
          stage: row.deal.stage,
          notes: row.deal.notes,
          tasks: row.deal.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate?.toISOString() ?? null,
          })),
          activities: row.deal.activities.map((a) => ({
            id: a.id,
            type: a.type,
            content: a.content,
            createdAt: a.createdAt.toISOString(),
          })),
        }
      : null,
  };

  return { ok: true as const, appointment };
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
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Revisa fecha, hora y título.",
    };
  }
  const data = parsed.data;
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

  if (data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, businessId },
      select: { id: true },
    });
    if (!contact) {
      return { ok: false as const, error: "Contacto no encontrado." };
    }
  }
  if (data.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: data.dealId, businessId },
      select: { id: true },
    });
    if (!deal) {
      return { ok: false as const, error: "Deal no encontrado." };
    }
  }
  if (data.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, businessId },
      select: { id: true },
    });
    if (!lead) {
      return { ok: false as const, error: "Lead no encontrado." };
    }
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
      ...(data.contactId !== undefined && { contactId: data.contactId || null }),
      ...(data.dealId !== undefined && { dealId: data.dealId || null }),
      ...(data.leadId !== undefined && { leadId: data.leadId || null }),
      lat,
      lng,
      mapsUrl,
    },
  });

  const shouldSyncGoogle =
    data.syncCalendar !== false &&
    Boolean(
      data.title ||
        data.startsAt ||
        data.endsAt ||
        data.status ||
        data.address !== undefined ||
        data.city !== undefined ||
        data.state !== undefined ||
        data.zip !== undefined,
    );

  if (
    limits.googleCalendar &&
    updated.googleEventId &&
    shouldSyncGoogle
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

export async function completeAppointment(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const parsed = z
    .object({
      id: z.string().min(1),
      outcome: z.string().max(2000).optional(),
      followUpTitle: z.string().max(200).optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Datos inválidos." };
  }
  const data = parsed.data;

  const existing = await prisma.appointment.findFirst({
    where: { id: data.id, businessId },
    select: { id: true, title: true, dealId: true, status: true },
  });
  if (!existing) {
    return { ok: false as const, error: "Cita no encontrada." };
  }

  const updated = await updateAppointment({ id: existing.id, status: "DONE" });
  if (!updated.ok) return updated;

  const outcome = data.outcome?.trim();
  if (existing.dealId) {
    await prisma.activity
      .create({
        data: {
          businessId,
          dealId: existing.dealId,
          type: "note",
          content: outcome
            ? `Visita completada — ${outcome}`
            : `Visita completada: ${existing.title}`,
        },
      })
      .catch(() => undefined);
  }

  const followUp = data.followUpTitle?.trim();
  if (followUp && existing.dealId) {
    await prisma.task.create({
      data: {
        businessId,
        dealId: existing.dealId,
        title: followUp,
        status: TaskStatus.TODO,
      },
    });
  }

  revalidateAppointments();
  revalidatePath("/app/deals");
  revalidatePath("/app/tareas");
  return { ok: true as const };
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
