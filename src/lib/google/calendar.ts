import { getAppBaseUrl } from "@/lib/app-url";

export type CalendarEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  timezone?: string;
  /** Konnect appointment id for deep link */
  appointmentId?: string;
};

function toGoogleDate(d: Date, timezone: string) {
  return {
    dateTime: d.toISOString(),
    timeZone: timezone,
  };
}

export async function createCalendarEvent(
  accessToken: string,
  input: CalendarEventInput,
  calendarId = "primary",
) {
  const tz = input.timezone || "America/New_York";
  const body = {
    summary: input.summary,
    description:
      (input.description ?? "") +
      (input.appointmentId
        ? `\n\nKonnect: ${getAppBaseUrl()}/app/citas?id=${input.appointmentId}`
        : ""),
    location: input.location,
    start: toGoogleDate(input.start, tz),
    end: toGoogleDate(input.end, tz),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("[google calendar] create failed:", text);
    throw new Error("No se pudo crear el evento en Google Calendar.");
  }
  const data = (await res.json()) as { id: string };
  return { eventId: data.id, calendarId };
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  input: CalendarEventInput,
  calendarId = "primary",
) {
  const tz = input.timezone || "America/New_York";
  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: toGoogleDate(input.start, tz),
    end: toGoogleDate(input.end, tz),
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("[google calendar] update failed:", text);
    throw new Error("No se pudo actualizar el evento en Google Calendar.");
  }
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary",
) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.error("[google calendar] delete failed:", text);
  }
}

/** Free/busy para booking público (ventana UTC ISO). */
export async function queryFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarId = "primary",
) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    console.error("[google calendar] freeBusy failed:", await res.text());
    return [] as { start: string; end: string }[];
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  return data.calendars?.[calendarId]?.busy ?? [];
}
