"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error("[public] error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorBody")}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}
