"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/registrar-empresa"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
