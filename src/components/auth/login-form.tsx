"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { SignIn, useAuth, useClerk } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  clearClerkBrowserCookies,
  hasMixedClerkInstanceCookies,
} from "@/lib/clerk-cookies";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/app/dashboard";
  }
  return raw;
}

function continueUrl(callbackUrl: string) {
  return `/auth/continue?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

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

function LoginSignIn() {
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const redirectUrl = continueUrl(callbackUrl);
  const authError = searchParams.get("authError");
  const sessionBroken =
    authError === "no_server_session" || authError === "handshake_loop";
  const redirectedRef = useRef(false);
  const mixedResetRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // Cookies mezcladas de instancias distintas → hard reset una vez.
  useEffect(() => {
    if (mixedResetRef.current || !isLoaded || sessionBroken) return;
    if (!hasMixedClerkInstanceCookies()) return;
    mixedResetRef.current = true;
    void (async () => {
      await clearAllClerkCookies();
      try {
        await signOut({ redirectUrl: undefined });
      } catch {
        // ignore
      }
      await clearAllClerkCookies();
      window.location.replace(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    })();
  }, [isLoaded, sessionBroken, signOut, callbackUrl]);

  // Tras sign-in: navegación full-page para que el servidor vea cookies nuevas.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || sessionBroken || redirectedRef.current) {
      return;
    }
    redirectedRef.current = true;
    window.location.assign(redirectUrl);
  }, [isLoaded, isSignedIn, sessionBroken, redirectUrl]);

  async function hardReset() {
    setBusy(true);
    try {
      await clearAllClerkCookies();
      try {
        await signOut({ redirectUrl: undefined });
      } catch {
        // ignore
      }
      await clearAllClerkCookies();
    } finally {
      window.location.assign(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
  }

  if (!isLoaded) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando…
      </p>
    );
  }

  if (sessionBroken) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {authError === "handshake_loop"
            ? "Clerk entró en un loop de handshake (sesión sin __client_uat)."
            : "El login del navegador funcionó, pero el servidor no recibió la sesión."}
        </p>
        <p className="text-sm text-muted-foreground">
          Hay que borrar también la cookie HttpOnly{" "}
          <code className="text-xs">__session</code> (el navegador solo no
          basta). Luego vuelve a iniciar sesión.
        </p>
        <Button type="button" disabled={busy} onClick={() => void hardReset()}>
          {busy ? "Limpiando…" : "Limpiar sesión y reintentar"}
        </Button>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ya iniciaste sesión. Redirigiendo…
      </p>
    );
  }

  return (
    <SignIn
      routing="hash"
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      signUpUrl="/signup"
    />
  );
}

export function LoginForm() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Accede al CRM con email/contraseña o Google (OAuth vía Clerk).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Suspense
            fallback={
              <p className="py-8 text-sm text-muted-foreground">Cargando…</p>
            }
          >
            <LoginSignIn />
          </Suspense>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
