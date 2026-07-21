"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

const PRODUCTION_PROXY = "https://konnect.kmd.agency/__clerk";

function resolveProxyUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  const raw =
    fromEnv ||
    (process.env.VERCEL_ENV === "production" ? PRODUCTION_PROXY : undefined);
  if (!raw) return undefined;
  // Clerk docs usan trailing slash en el proxy URL.
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  const proxyUrl = resolveProxyUrl();

  return (
    <ClerkProvider
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
