"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginSignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const redirectUrl = continueUrl(callbackUrl);
  const authError = searchParams.get("authError");
  const sessionBroken = authError === "no_server_session";
  const redirectedRef = useRef(false);
  const cleanedRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // Limpia cookies de instancias mezcladas al montar.
  useEffect(() => {
    if (cleanedRef.current) return;
    if (!hasMixedClerkInstanceCookies()) return;
    cleanedRef.current = true;
    clearClerkBrowserCookies();
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || sessionBroken || redirectedRef.current) {
      return;
    }
    redirectedRef.current = true;
    router.replace(redirectUrl);
  }, [isLoaded, isSignedIn, sessionBroken, redirectUrl, router]);

  // Cliente ya no firmado pero URL sigue con authError → limpia query y muestra SignIn.
  useEffect(() => {
    if (!isLoaded || isSignedIn || !sessionBroken) return;
    clearClerkBrowserCookies();
    router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [isLoaded, isSignedIn, sessionBroken, callbackUrl, router]);

  async function hardSignOut() {
    setBusy(true);
    try {
      clearClerkBrowserCookies();
      await signOut({ redirectUrl: "/login" });
    } finally {
      clearClerkBrowserCookies();
      window.location.assign("/login");
    }
  }

  async function retryContinue() {
    setBusy(true);
    redirectedRef.current = false;
    router.replace(redirectUrl);
  }

  if (!isLoaded) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando…
      </p>
    );
  }

  if (isSignedIn && sessionBroken) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tu sesión en el navegador no coincide con el servidor (cookies o
          proxy de Clerk). Cierra sesión o reintenta.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void retryContinue()}
          >
            {busy ? "Reintentando…" : "Reintentar"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void hardSignOut()}
          >
            {busy ? "Saliendo…" : "Cerrar sesión"}
          </Button>
        </div>
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
