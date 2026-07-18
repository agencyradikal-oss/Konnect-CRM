import type { Plan } from "@prisma/client";
import { getPlanLimits } from "@/lib/plans";
import { startOfMonth, startOfNextMonth } from "@/lib/date-range";

/**
 * IDs de leads del mes actual que quedan desbloqueados según el plan.
 * Los leads se guardan siempre; FREE solo puede ver los primeros N del mes.
 */
export function unlockedLeadIdsForMonth(
  monthLeadIdsAsc: string[],
  plan: Plan,
): Set<string> {
  const limit = getPlanLimits(plan).leadsPerMonth;
  if (limit === null) return new Set(monthLeadIdsAsc);
  return new Set(monthLeadIdsAsc.slice(0, limit));
}

export function monthBounds(d = new Date()) {
  return {
    start: startOfMonth(d),
    end: startOfNextMonth(d),
  };
}
