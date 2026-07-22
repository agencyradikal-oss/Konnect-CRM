"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearClerkBrowserCookies } from "@/lib/clerk-cookies";

type AuthStatus = {
  clerkHasUserId: boolean;
  prisma: { ok: boolean; hasBusinessId?: boolean };
};

async function clearAllClerkCookies() {
  clearClerkBrowserCookies();
  try {
    await fetch("/api/auth/clear-clerk", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // ignore
  }
  clearClerkBrowserCookies();
}

async function readStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/auth/status", {
    credentials: "include",
    cache: "no-store",
  });
  return (await res.json()) as AuthStatus;
}

/**
 * Tras OAuth/password el cliente Clerk puede firmar antes de que el servidor
 * vea __session. Esperamos el handshake (poll) en vez de fallar al instante.
 */
export function AuthContinueClient({ callbackUrl }: { callbackUrl: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [message, setMessage] = useState("Sincronizando sesión…");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || started.current) return;
    started.current = true;

    let cancelled = false;
    const startedAt = Date.now();
    const maxMs = 12_000;

    void (async () => {
      // Si el cliente aún no firmó, dale un momento (OAuth acaba de volver).
      for (let i = 0; i < 20 && !cancelled; i++) {
        const status = await readStatus();
        if (cancelled) return;

        if (status.clerkHasUserId) {
          if (!status.prisma.ok) {
            setMessage("Creando tu cuenta en Konnect…");
            try {
              await fetch("/api/auth/sync", {
                method: "POST",
                credentials: "include",
                cache: "no-store",
              });
            } catch {
              // ignore; re-poll
            }
            continue;
          }

          const dest = status.prisma.hasBusinessId
            ? callbackUrl
            : "/registrar-empresa";
          window.location.replace(dest);
          return;
        }

        if (Date.now() - startedAt > maxMs) break;
        setMessage(
          isSignedIn
            ? "El navegador ya firmó; esperando cookie de servidor…"
            : "Esperando sesión de Clerk…",
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!cancelled) {
        setFailed(true);
        setMessage(
          "El servidor no recibió la sesión de Clerk. Limpia cookies e inténtalo de nuevo.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, callbackUrl]);

  async function hardReset() {
    setBusy(true);
    await clearAllClerkCookies();
    window.location.assign(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {failed ? (
        <Button type="button" disabled={busy} onClick={() => void hardReset()}>
          {busy ? "Limpiando…" : "Limpiar sesión y volver al login"}
        </Button>
      ) : null}
    </div>
  );
}
