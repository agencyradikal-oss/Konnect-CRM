/**
 * Helpers para diagnosticar Frontend API (FAPI) de Clerk vs proxy.
 * La publishable key (`pk_live_` / `pk_test_`) codifica el host FAPI en base64.
 */

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeClerkFrontendApiHost(
  publishableKey: string | undefined | null,
): string | null {
  const raw = publishableKey?.trim();
  if (!raw) return null;
  const m = raw.match(/^pk_(?:live|test)_(.+)$/);
  if (!m?.[1]) return null;
  try {
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (b64.length % 4)) % 4;
    if (pad) b64 += "=".repeat(pad);
    const decoded = decodeBase64Utf8(b64).replace(/\$$/, "");
    const host = decoded.trim();
    return host || null;
  } catch {
    return null;
  }
}


/** FAPI custom (ej. clerk.konnect.kmd.agency) vs default *.clerk.accounts.dev */
export function isCustomClerkFrontendApi(host: string | null): boolean {
  if (!host) return false;
  return !host.endsWith(".clerk.accounts.dev") && host !== "clerk.accounts.dev";
}

export function resolveClerkProxyUrl(
  envProxyUrl: string | undefined | null = process.env.NEXT_PUBLIC_CLERK_PROXY_URL,
): string | undefined {
  const raw = envProxyUrl?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

export type ClerkFapiHealth = {
  fapiHost: string | null;
  isCustomFapi: boolean;
  proxyConfigured: boolean;
  proxyUrl: string | null;
  /** true = config inconsistente que rompe login */
  mismatch: boolean;
  /** Mensaje operativo corto (ES) */
  advice: string | null;
};

/**
 * Invariante de producción:
 * - FAPI default (*.clerk.accounts.dev) → SIN proxy
 * - FAPI custom sin DNS → CON proxy (NEXT_PUBLIC_CLERK_PROXY_URL + middleware frontendApiProxy)
 * Nunca a medias (custom sin proxy, o default con proxy).
 */
export function assessClerkFapiHealth(input?: {
  publishableKey?: string | null;
  proxyUrl?: string | null;
}): ClerkFapiHealth {
  const fapiHost = decodeClerkFrontendApiHost(
    input?.publishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const proxyUrl =
    resolveClerkProxyUrl(input?.proxyUrl ?? process.env.NEXT_PUBLIC_CLERK_PROXY_URL) ??
    null;
  const isCustomFapi = isCustomClerkFrontendApi(fapiHost);
  const proxyConfigured = Boolean(proxyUrl);

  let mismatch = false;
  let advice: string | null = null;

  if (isCustomFapi && !proxyConfigured) {
    mismatch = true;
    advice =
      "FAPI custom sin proxy: login falla (DNS/ERR_NAME_NOT_RESOLVED). Activa NEXT_PUBLIC_CLERK_PROXY_URL + frontendApiProxy, o quita el FAPI custom en Clerk Dashboard.";
  } else if (!isCustomFapi && proxyConfigured) {
    mismatch = true;
    advice =
      "FAPI default con proxy configurado: quita NEXT_PUBLIC_CLERK_PROXY_URL de Vercel (estado a medias).";
  } else if (isCustomFapi && proxyConfigured) {
    advice =
      "Modo proxy activo (temporal). Objetivo estable: quitar FAPI custom en Clerk y luego quitar el proxy.";
  }

  return {
    fapiHost,
    isCustomFapi,
    proxyConfigured,
    proxyUrl,
    mismatch,
    advice,
  };
}
