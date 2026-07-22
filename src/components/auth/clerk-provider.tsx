"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { ReactNode } from "react";

/**
 * Clerk sin proxy FAPI. La instancia debe usar el Frontend API default
 * (*.clerk.accounts.dev), no clerk.kmd.agency.
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
