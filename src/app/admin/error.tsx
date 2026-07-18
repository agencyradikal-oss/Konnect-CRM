"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold">Error en admin</h1>
      <p className="text-sm text-muted-foreground">
        Hubo un problema al cargar el panel. Intenta de nuevo.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Volver</Link>
        </Button>
      </div>
    </div>
  );
}
