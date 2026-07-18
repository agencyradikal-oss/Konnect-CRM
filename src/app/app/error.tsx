"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[crm] error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold">Algo salió mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        No pudimos cargar esta sección del CRM. Intenta de nuevo.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/app/dashboard">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
