import { readFileSync, existsSync } from "fs";

/**
 * Quita proxy_url del dominio primario en Clerk.
 * Requiere CLERK_SECRET_KEY (Production).
 *
 * Tras esto: en Clerk Dashboard → Domains, elimina el Frontend API custom
 * `clerk.kmd.agency` para usar `*.clerk.accounts.dev`. Si Clerk rota keys,
 * actualiza Vercel. Quita NEXT_PUBLIC_CLERK_PROXY_URL de Vercel.
 */

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
    // Prefer non-empty values (ignore blank .env.local placeholders).
    if (!v) continue;
    if (!process.env[k] || process.env[k] === "") process.env[k] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");
loadEnv(".env.vercel.clear.tmp");

const key = process.env.CLERK_SECRET_KEY;
if (!key) {
  console.log("NO_SECRET");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const listRes = await fetch("https://api.clerk.com/v1/domains", { headers });
const listBody = await listRes.json();
console.log("LIST_STATUS=" + listRes.status);

const domains = Array.isArray(listBody) ? listBody : listBody.data || listBody;
const summary = (domains || []).map((d) => ({
  id: d.id,
  name: d.name,
  proxy_url: d.proxy_url ?? d.proxyUrl ?? null,
  frontend_api_url: d.frontend_api_url ?? d.frontendApiUrl ?? null,
}));
console.log("DOMAINS=" + JSON.stringify(summary, null, 2));

const target =
  (domains || []).find((d) => !d.is_satellite && !d.isSatellite) ||
  (domains || [])[0];

if (!target?.id) {
  console.log("NO_DOMAIN");
  process.exit(1);
}

console.log("CLEARING_PROXY domain=" + target.id + " name=" + target.name);

const patchRes = await fetch(`https://api.clerk.com/v1/domains/${target.id}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ proxy_url: null }),
});
const patchBody = await patchRes.json();
console.log("PATCH_STATUS=" + patchRes.status);
console.log(
  "PATCH_RESULT=" +
    JSON.stringify({
      id: patchBody.id,
      name: patchBody.name,
      proxy_url: patchBody.proxy_url ?? patchBody.proxyUrl ?? null,
      frontend_api_url:
        patchBody.frontend_api_url ?? patchBody.frontendApiUrl ?? null,
      errors: patchBody.errors ?? null,
      message: patchBody.message ?? null,
    }),
);
