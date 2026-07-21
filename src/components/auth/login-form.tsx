"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/app/dashboard";
  }
  return raw;
}

/** Post-auth: decide CRM vs registrar-empresa según businessId en servidor. */
function continueUrl(callbackUrl: string) {
  return `/auth/continue?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

function LoginSignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const redirectUrl = continueUrl(callbackUrl);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "11ae6f",
      },
      body: JSON.stringify({
        sessionId: "11ae6f",
        runId: "post-fix",
        hypothesisId: "A",
        location: "login-form.tsx:state",
        message: "login-auth-state",
        data: {
          isLoaded,
          isSignedIn: Boolean(isSignedIn),
          hasUserId: Boolean(userId),
          redirectUrl,
          callbackRaw: searchParams.get("callbackUrl"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [isLoaded, isSignedIn, userId, redirectUrl, searchParams]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // #region agent log
      fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "11ae6f",
        },
        body: JSON.stringify({
          sessionId: "11ae6f",
          runId: "post-fix",
          hypothesisId: "B",
          location: "login-form.tsx:redirect",
          message: "calling-router-replace",
          data: { redirectUrl },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      router.replace(redirectUrl);
    }
  }, [isLoaded, isSignedIn, redirectUrl, router]);

  if (!isLoaded) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando…
      </p>
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
