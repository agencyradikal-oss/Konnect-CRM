/**
 * Limpia cookies de Clerk en el browser (incl. restos de otras instancias).
 * Necesario cuando hay mezcla de `__session_*` / `__client_uat_*` de varios apps.
 */
export function clearClerkBrowserCookies() {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);

  const targets = names.filter((name) =>
    /^(?:__session|__client|__clerk|clerk_)/i.test(name),
  );

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
