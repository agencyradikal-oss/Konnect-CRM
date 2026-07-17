"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadSourceLabels, leadStatusLabels } from "@/components/crm/stage-badge";
import type { LeadSource, LeadStatus } from "@prisma/client";

const sources = Object.keys(leadSourceLabels) as LeadSource[];
const statuses = Object.keys(leadStatusLabels) as LeadStatus[];

export function LeadsFilters({
  source,
  status,
}: {
  source?: string;
  status?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "source" | "status", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={source ?? "all"} onValueChange={(v) => update("source", v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Fuente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las fuentes</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s} value={s}>
              {leadSourceLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status ?? "all"} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {leadStatusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
