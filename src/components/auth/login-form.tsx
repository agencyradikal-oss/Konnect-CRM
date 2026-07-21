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
  const resetRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // Cookies mezcladas o sesión rota → hard reset una vez.
  useEffect(() => {
    if (resetRef.current || !isLoaded) return;
    const shouldReset = sessionBroken || hasMixedClerkInstanceCookies();
    if (!shouldReset) return;
    resetRef.current = true;
    void (async () => {
      clearClerkBrowserCookies();
      try {
        await signOut({ redirectUrl: undefined });
      } catch {
        // ignore
      }
      clearClerkBrowserCookies();
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    })();
  }, [isLoaded, sessionBroken, signOut, router, callbackUrl]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || sessionBroken || redirectedRef.current) {
      return;
    }
    redirectedRef.current = true;
    router.replace(redirectUrl);
  }, [isLoaded, isSignedIn, sessionBroken, redirectUrl, router]);

  async function hardSignOut() {
    setBusy(true);
    clearClerkBrowserCookies();
    try {
      await signOut({ redirectUrl: "/login" });
    } finally {
      clearClerkBrowserCookies();
      window.location.assign("/login");
    }
  }

  if (!isLoaded || (sessionBroken && !resetRef.current)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando…
      </p>
    );
  }

  if (sessionBroken) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Reiniciando sesión… Si esto no desaparece, cierra sesión.
        </p>
        <Button type="button" disabled={busy} onClick={() => void hardSignOut()}>
          {busy ? "Saliendo…" : "Cerrar sesión"}
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
