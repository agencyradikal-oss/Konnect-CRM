"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { ReactNode } from "react";

/**
 * FAPI custom sin DNS (clerk.konnect.kmd.agency). Proxy obligatorio
 * hasta eliminar el dominio custom en Clerk → *.clerk.accounts.dev.
 */
const PRODUCTION_PROXY = "https://konnect.kmd.agency/__clerk";

function resolveProxyUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  const raw =
    fromEnv ||
    (process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
      ? PRODUCTION_PROXY
      : undefined);
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

export function KonnectClerkProvider({ children }: { children: ReactNode }) {
  const proxyUrl = resolveProxyUrl();

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
