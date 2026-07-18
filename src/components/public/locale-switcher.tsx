"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/actions/locale";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: "es" | "en") {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-background p-0.5 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <Button
        type="button"
        size="sm"
        variant={locale === "es" ? "default" : "ghost"}
        className="h-7 px-2"
        disabled={pending}
        onClick={() => switchTo("es")}
      >
        ES
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "default" : "ghost"}
        className="h-7 px-2"
        disabled={pending}
        onClick={() => switchTo("en")}
      >
        EN
      </Button>
    </div>
  );
}
