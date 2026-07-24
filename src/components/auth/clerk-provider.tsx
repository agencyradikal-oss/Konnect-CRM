"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { ReactNode } from "react";

/**
 * Proxy omitido por ahora: Clerk habla directo con FAPI
 * (*.clerk.accounts.dev). No forzar /__clerk.
 */
export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={esES}
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/auth/continue?callbackUrl=%2Fapp%2Fdashboard"
      signUpFallbackRedirectUrl="/auth/continue?callbackUrl=%2Fregistrar-empresa"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
