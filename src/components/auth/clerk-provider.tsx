"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Sin proxy FAPI: usamos el Frontend API por defecto del publishable key
 * (`*.clerk.accounts.dev`). El proxy `/__clerk` exigía Domains→Set proxy en
 * Dashboard y provocaba cliente firmado / servidor sin sesión.
 */
export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
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
