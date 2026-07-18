"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openBillingPortal, startCheckout } from "@/actions/billing";

export function UpgradeButton({
  plan,
  disabled,
  label,
}: {
  plan: "PRO" | "PREMIUM";
  disabled?: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || pending}
      variant={disabled ? "outline" : "default"}
      className="w-full"
      onClick={() =>
        startTransition(async () => {
          const res = await startCheckout({ plan });
          // redirect() no retorna; si hay error de config sí.
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending ? "Redirigiendo…" : label}
    </Button>
  );
}

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await openBillingPortal();
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending ? "Abriendo…" : "Gestionar facturación / cancelar"}
    </Button>
  );
}
