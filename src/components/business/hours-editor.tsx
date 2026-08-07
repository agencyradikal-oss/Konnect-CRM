"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  defaultHours,
  type DayHours,
  type WeekHours,
} from "@/lib/hours";

export type { DayHours, WeekHours };
export { defaultHours, normalizeWeekHours } from "@/lib/hours";

const dayLabels: Record<string, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

export function HoursEditor({
  value,
  onChange,
}: {
  value: WeekHours;
  onChange: (hours: WeekHours) => void;
}) {
  function update(day: string, patch: Partial<DayHours>) {
    const base = value[day] ?? defaultHours[day];
    onChange({ ...value, [day]: { ...base, ...patch } });
  }

  return (
    <div className="space-y-2">
      {Object.keys(dayLabels).map((day) => {
        const dayValue = value[day] ?? defaultHours[day];
        return (
          <div key={day} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm font-medium">
              {dayLabels[day]}
            </span>
            <Button
              type="button"
              size="sm"
              variant={dayValue.closed ? "secondary" : "outline"}
              className={cn("w-24", dayValue.closed && "text-muted-foreground")}
              onClick={() => update(day, { closed: !dayValue.closed })}
            >
              {dayValue.closed ? "Cerrado" : "Abierto"}
            </Button>
            {!dayValue.closed && (
              <>
                <Input
                  type="time"
                  value={dayValue.open}
                  onChange={(e) => update(day, { open: e.target.value })}
                  className="w-28"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={dayValue.close}
                  onChange={(e) => update(day, { close: e.target.value })}
                  className="w-28"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
