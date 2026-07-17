"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateBusiness } from "@/actions/admin";
import type { BusinessStatus } from "@prisma/client";

export function ModerationActions({
  businessId,
  status,
}: {
  businessId: string;
  status: BusinessStatus;
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: BusinessStatus) {
    startTransition(async () => {
      const res = await moderateBusiness({ businessId, status: next });
      if (res.ok) toast.success("Estado actualizado.");
      else toast.error("No se pudo actualizar.");
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "ACTIVE" && (
        <Button size="sm" disabled={pending} onClick={() => setStatus("ACTIVE")}>
          Aprobar
        </Button>
      )}
      {status !== "SUSPENDED" && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setStatus("SUSPENDED")}
        >
          Suspender
        </Button>
      )}
    </div>
  );
}
