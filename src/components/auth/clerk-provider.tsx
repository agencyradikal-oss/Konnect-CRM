"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

const PRODUCTION_PROXY = "https://konnect.kmd.agency/__clerk";

function resolveProxyUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (fromEnv) return fromEnv;
  // Build de producción en Vercel sin depender de setear la env a mano
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_PROXY;
  return undefined;
}

export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  const proxyUrl = resolveProxyUrl();

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/registrar-empresa"
      afterSignOutUrl="/"
      {...(proxyUrl ? { proxyUrl } : {})}
    >
      {children}
    </ClerkProvider>
  );
}
