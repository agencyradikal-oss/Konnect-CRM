import type { NextRequest, NextResponse } from "next/server";

const CLERK_COOKIE_RE =
  /^(?:__session|__client_uat|__client|__refresh|__clerk|clerk_)/i;

export function isClerkCookieName(name: string) {
  return CLERK_COOKIE_RE.test(name);
}

/**
 * Limpia cookies de Clerk visibles en el browser (no HttpOnly).
 * Para __session HttpOnly hay que usar /api/auth/clear-clerk.
 */
export function clearClerkBrowserCookies() {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);

  const targets = names.filter((name) => isClerkCookieName(name));

  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  const parts = host.split(".");
  const rootDomain =
    parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : host;

  for (const name of targets) {
    document.cookie = `${name}=; expires=${expires}; path=/`;
    document.cookie = `${name}=; expires=${expires}; path=/; domain=${host}`;
    document.cookie = `${name}=; expires=${expires}; path=/; domain=${rootDomain}`;
  }
}

/** Detecta cookies de más de una instancia Clerk (sufijos distintos). */
export function hasMixedClerkInstanceCookies() {
  if (typeof document === "undefined") return false;
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
  const suffixes = new Set<string>();
  for (const name of names) {
    const m = name.match(/^__(?:session|client_uat)_(.+)$/);
    if (m?.[1]) suffixes.add(m[1]);
  }
  return suffixes.size > 1;
}

/** Expira cookies Clerk (incl. HttpOnly) en una respuesta del servidor. */
export function expireClerkCookiesOnResponse(
  res: NextResponse,
  req?: NextRequest,
) {
  const names = new Set<string>([
    "__session",
    "__client",
    "__client_uat",
    "__refresh",
    "__clerk_handshake",
    "__clerk_db_jwt",
  ]);

  if (req) {
    for (const c of req.cookies.getAll()) {
      if (isClerkCookieName(c.name)) names.add(c.name);
    }
  }

  for (const name of names) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return res;
}
