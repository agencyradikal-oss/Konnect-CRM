"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearClerkBrowserCookies } from "@/lib/clerk-cookies";

type AuthStatus = {
  clerk: "missing" | "ok";
  prisma: "skipped" | "ok" | "missing_user" | "error";
  clerkHasUserId: boolean;
  prismaOk: boolean;
  hasBusinessId?: boolean;
};

const MAX_ATTEMPTS = 8;
const RETRY_MS = 750;

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
 * Tras OAuth/password: espera handshake limitado (no loop infinito).
 * Solo confía en clerkHasUserId del servidor, no en isSignedIn del cliente.
 */
export function AuthContinueClient({ callbackUrl }: { callbackUrl: string }) {
  const { isLoaded } = useAuth();
  const { signOut } = useClerk();
  const [message, setMessage] = useState("Sincronizando sesión…");
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || started.current) return;
    started.current = true;

    let cancelled = false;

    void (async () => {
      for (let i = 1; i <= MAX_ATTEMPTS && !cancelled; i++) {
        setAttempt(i);
        const status = await readStatus();
        if (cancelled) return;

        if (status.clerk === "ok" && status.clerkHasUserId) {
          if (status.prisma === "missing_user" || !status.prismaOk) {
            setMessage(`Creando tu cuenta en Konnect… (${i}/${MAX_ATTEMPTS})`);
            try {
              await fetch("/api/auth/sync", {
                method: "POST",
                credentials: "include",
                cache: "no-store",
              });
            } catch {
              // re-poll
            }
            await new Promise((r) => setTimeout(r, RETRY_MS));
            continue;
          }

          if (status.prisma === "ok") {
            const dest = status.hasBusinessId
              ? callbackUrl
              : "/registrar-empresa";
            window.location.replace(dest);
            return;
          }
        }

        setMessage(
          `Esperando sesión en el servidor… (${i}/${MAX_ATTEMPTS})`,
        );
        if (i < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_MS));
        }
      }

      if (!cancelled) {
        setFailed(true);
        setMessage(
          "El servidor no recibió la sesión de Clerk. Limpia la sesión e inténtalo de nuevo.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, callbackUrl]);

  async function hardReset() {
    setBusy(true);
    await clearAllClerkCookies();
    try {
      await signOut({ redirectUrl: undefined });
    } catch {
      // ignore
    }
    await clearAllClerkCookies();
    window.location.assign(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {!failed && attempt > 0 ? (
        <p className="text-xs text-muted-foreground">
          Intento {attempt} de {MAX_ATTEMPTS}
        </p>
      ) : null}
      {failed ? (
        <Button type="button" disabled={busy} onClick={() => void hardReset()}>
          {busy ? "Limpiando…" : "Limpiar sesión y volver al login"}
        </Button>
      ) : null}
    </div>
  );
}
