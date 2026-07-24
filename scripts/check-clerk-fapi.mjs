/**
 * Imprime diagnóstico FAPI vs proxy (sin secretos).
 * Uso: node scripts/check-clerk-fapi.mjs
 * Opcional: carga .env.local / .env si existen.
 */
import { readFileSync, existsSync } from "fs";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!v) continue;
    if (!process.env[k] || process.env[k] === "") process.env[k] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

function decodeHost(pk) {
  const m = String(pk || "").trim().match(/^pk_(?:live|test)_(.+)$/);
  if (!m) return null;
  let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (b64.length % 4)) % 4;
  if (pad) b64 += "=".repeat(pad);
  try {
    return Buffer.from(b64, "base64").toString("utf8").replace(/\$$/, "").trim();
  } catch {
    return null;
  }
}

const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const proxy = (process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "").trim().replace(/\/$/, "") || null;
const host = decodeHost(pk);
const isCustom = host
  ? !(host.endsWith(".clerk.accounts.dev") || host === "clerk.accounts.dev")
  : false;
const proxyOn = Boolean(proxy);
const mismatch =
  (isCustom && !proxyOn) || (!isCustom && host && proxyOn);

console.log(
  JSON.stringify(
    {
      fapiHost: host,
      isCustomFapi: isCustom,
      proxyConfigured: proxyOn,
      proxyUrl: proxy,
      mismatch,
      mode: !host
        ? "unknown (sin publishable key en env)"
        : isCustom && proxyOn
          ? "B (proxy temporal)"
          : !isCustom && !proxyOn
            ? "A (estable)"
            : "MISMATCH — ver docs/auth-clerk.md",
    },
    null,
    2,
  ),
);

if (mismatch) process.exit(2);
