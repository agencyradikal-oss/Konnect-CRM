"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDealStage } from "@/actions/crm";
import type { DealStage } from "@prisma/client";

const stages: { value: DealStage; label: string }[] = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "NEGOCIACION", label: "Negociación" },
  { value: "GANADO", label: "Ganado" },
  { value: "PERDIDO", label: "Perdido" },
];

export function DealStageSelect({
  dealId,
  stage,
}: {
  dealId: string;
  stage: DealStage;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={stage}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const res = await updateDealStage({ dealId, stage: value as DealStage });
          if (!res.ok) toast.error(res.error);
        })
      }
    >
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
