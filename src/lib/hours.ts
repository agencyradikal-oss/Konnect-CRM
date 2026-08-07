export type DayHours = { open: string; close: string; closed: boolean };
export type WeekHours = Record<string, DayHours>;

export const defaultHours: WeekHours = {
  mon: { open: "09:00", close: "18:00", closed: false },
  tue: { open: "09:00", close: "18:00", closed: false },
  wed: { open: "09:00", close: "18:00", closed: false },
  thu: { open: "09:00", close: "18:00", closed: false },
  fri: { open: "09:00", close: "18:00", closed: false },
  sat: { open: "10:00", close: "14:00", closed: false },
  sun: { open: "10:00", close: "14:00", closed: true },
};

function padTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/**
 * Convierte horarios legacy del seed (`"9:00-18:00"` / `null`)
 * al shape del editor `{ open, close, closed }`.
 */
export function normalizeWeekHours(raw: unknown): WeekHours {
  const out: WeekHours = {
    mon: { ...defaultHours.mon },
    tue: { ...defaultHours.tue },
    wed: { ...defaultHours.wed },
    thu: { ...defaultHours.thu },
    fri: { ...defaultHours.fri },
    sat: { ...defaultHours.sat },
    sun: { ...defaultHours.sun },
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return out;
  }

  for (const day of Object.keys(out)) {
    const v = (raw as Record<string, unknown>)[day];
    if (v === null || v === undefined) {
      out[day] = { ...out[day], closed: true };
      continue;
    }
    if (typeof v === "string") {
      const m = v.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (m) {
        out[day] = {
          open: padTime(m[1]),
          close: padTime(m[2]),
          closed: false,
        };
      }
      continue;
    }
    if (typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      out[day] = {
        open:
          typeof o.open === "string" && o.open
            ? padTime(o.open)
            : out[day].open,
        close:
          typeof o.close === "string" && o.close
            ? padTime(o.close)
            : out[day].close,
        closed: typeof o.closed === "boolean" ? o.closed : false,
      };
    }
  }

  return out;
}
