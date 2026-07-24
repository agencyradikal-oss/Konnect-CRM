"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { ReactNode } from "react";

/**
 * Si NEXT_PUBLIC_CLERK_PROXY_URL está en el build (Vercel), ClerkJS la usa
 * sola. El middleware DEBE tener frontendApiProxy en ese mismo caso;
 * si no, /__clerk → 404 y el login se queda en "Cargando…".
 *
 * Ver docs/auth-clerk.md — invariante FAPI ↔ proxy.
 */
export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim().replace(
    /\/$/,
    "",
  );

  return (
    <ClerkProvider
      localization={esES}
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/auth/continue?callbackUrl=%2Fapp%2Fdashboard"
      signUpFallbackRedirectUrl="/auth/continue?callbackUrl=%2Fregistrar-empresa"
      afterSignOutUrl="/"
      {...(proxyUrl ? { proxyUrl } : {})}
    >
      {children}
    </ClerkProvider>
  );
}
