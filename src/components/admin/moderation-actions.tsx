"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveBusiness,
  rejectBusiness,
  approveReview,
  deleteReview,
} from "@/actions/admin";

export function BusinessModerationActions({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await approveBusiness({ businessId });
            if (res.ok) {
              toast.success("Negocio aprobado y publicado. Email enviado al dueño.");
            }
          })
        }
      >
        <Check className="size-4" /> Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await rejectBusiness({ businessId });
            if (res.ok) toast.success("Negocio rechazado.");
          })
        }
      >
        <X className="size-4" /> Rechazar
      </Button>
    </div>
  );
}

export function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await approveReview({ reviewId });
            if (res.ok) toast.success("Reseña aprobada.");
          })
        }
      >
        <Check className="size-4" /> Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await deleteReview({ reviewId });
            if (res.ok) toast.success("Reseña eliminada.");
          })
        }
      >
        <Trash2 className="size-4" /> Eliminar
      </Button>
    </div>
  );
}
