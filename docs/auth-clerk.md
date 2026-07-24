# Auth Clerk (interno)

Documento operativo para el equipo. Producto: **https://konnect.kmd.agency**.
No sustituye la sección Auth del [README](../README.md).

## Invariante (leer antes de tocar proxy / DNS)

Hay **exactamente dos modos válidos**. Cualquier mezcla rompe el login (síntoma: `/login` en «Cargando…»).

| Modo | Publishable key (FAPI) | `NEXT_PUBLIC_CLERK_PROXY_URL` | Middleware `frontendApiProxy` |
|------|------------------------|------------------------------|-------------------------------|
| **A — Estable** | `*.clerk.accounts.dev` | **ausente** | **off** |
| **B — Temporal** | custom (`clerk.konnect.kmd.agency`) **sin DNS** | `https://konnect.kmd.agency/__clerk` | **on** |

**Prohibido (estado a medias):**

1. Quitar el proxy del código / middleware **mientras** la key sigue siendo FAPI custom → `/__clerk` 404 + scripts Clerk apuntan al proxy → «Cargando…».
2. Dejar `NEXT_PUBLIC_CLERK_PROXY_URL` en Vercel **después** de pasar a FAPI default.
3. Hardcodear el proxy de producción en el repo (fuerza modo B aunque Vercel ya no lo tenga).

Código: proxy **solo** si la env está definida ([`middleware.ts`](../src/middleware.ts), [`clerk-provider.tsx`](../src/components/auth/clerk-provider.tsx)). Helpers: [`src/lib/clerk-fapi.ts`](../src/lib/clerk-fapi.ts).

## Arquitectura

```
Modo A (estable):
  Browser → ClerkJS → FAPI *.clerk.accounts.dev
  Server  → clerkMiddleware / auth() → Prisma User

Modo B (temporal, FAPI custom sin DNS):
  Browser → ClerkJS → https://konnect.kmd.agency/__clerk → Clerk FAPI
  Server  → clerkMiddleware (frontendApiProxy) → mismo proxy
```

- Auth: **Clerk** (email/password + Google OAuth).
- Roles / tenant: **Prisma** (`User.role`, `User.businessId`, `User.clerkUserId`).
- Sync: webhook `/api/webhooks/clerk` + `upsertUserFromClerk` en login/`auth()`.
- UI ES: `localization={esES}` en `KonnectClerkProvider`.

## Incidente 2026-07 (producción)

| Hallazgo | Valor |
|----------|--------|
| Key live decodificada | `clerk.konnect.kmd.agency` |
| DNS de ese host | **NXDOMAIN** |
| Vercel `NEXT_PUBLIC_CLERK_PROXY_URL` | presente (Production) |
| Middleware proxy | se había desactivado → `/__clerk` **404** |
| UI | `/login` stuck en «Cargando…» |

**Causa:** modo B a medias (env proxy + key custom, pero sin `frontendApiProxy`).
**Mitigación:** volver a modo B coherente (proxy env-gated en middleware) hasta migrar a modo A.

## Pasar a modo A (estable) — checklist

Hacer **en este orden** (no invertir):

1. Clerk Dashboard → **Configure → Domains** → quitar Frontend API custom (`clerk.konnect.kmd.agency` / `clerk.kmd.agency`).
2. Confirmar que la publishable key decodifica a `*.clerk.accounts.dev` (ver diagnóstico abajo). Si Clerk rota keys, actualizar Vercel.
3. Google Cloud OAuth: redirect URI = la de Clerk SSO (`*.clerk.accounts.dev/.../oauth_callback`), **no** `/__clerk/...`.
4. Vercel Production: **borrar** `NEXT_PUBLIC_CLERK_PROXY_URL`.
5. Redeploy. Verificar `/login` muestra el formulario Clerk (no «Cargando…»).
6. Opcional: `CLERK_SECRET_KEY=sk_live_… node scripts/clear-clerk-proxy.mjs` para `proxy_url: null` en la API de dominios.

## Reactivar modo B (solo si FAPI custom vuelve)

1. Vercel: `NEXT_PUBLIC_CLERK_PROXY_URL=https://konnect.kmd.agency/__clerk`
2. Clerk Domains → **Set proxy** = misma URL (`node scripts/set-clerk-proxy.mjs`).
3. Redeploy (el código ya activa `frontendApiProxy` si la env existe).
4. Google redirect: `https://konnect.kmd.agency/__clerk/v1/oauth_callback`

## Diagnóstico

### `GET /api/auth/status`

Incluye bloque `fapi` (sin secretos):

```json
{
  "clerk": "missing",
  "prisma": "skipped",
  "fapi": {
    "fapiHost": "clerk.konnect.kmd.agency",
    "isCustomFapi": true,
    "proxyConfigured": true,
    "proxyUrl": "https://konnect.kmd.agency/__clerk",
    "mismatch": false,
    "advice": "Modo proxy activo (temporal)…"
  }
}
```

Si `fapi.mismatch === true`, arreglar env/Dashboard antes de seguir.

Decodificar key a mano (PowerShell):

```powershell
$pk = "pk_live_...."  # publishable
$b64 = $pk -replace '^pk_(live|test)_',''
$pad = $b64 + ('=' * ((4 - $b64.Length % 4) % 4))
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($pad))
```

### Otros endpoints

| Endpoint | Uso |
|----------|-----|
| `POST /api/auth/clear-clerk` | Expira cookies Clerk (incl. HttpOnly `__session`) |
| `POST /api/auth/sync` | Fuerza upsert Prisma cuando ya hay `userId` |

## Flujo post-login: `/auth/continue`

1. Server: si `auth()` ya tiene usuario → redirect a dashboard o `/registrar-empresa`.
2. Si no: `AuthContinueClient` hace **8 intentos × 750 ms** contra `/api/auth/status`.
3. Solo avanza si `clerk === "ok"` en **servidor**.
4. Si agota → hard reset (clear cookies + `signOut` + `/login`).

## Checklist de incidentes

1. `/login` en «Cargando…» → `GET /api/auth/status` → mirar `fapi.mismatch` / `fapiHost`.
2. Consola: `ERR_NAME_NOT_RESOLVED` a `clerk.*.kmd.agency` → falta proxy (modo B) o quitar custom FAPI (modo A).
3. Consola / Network: `/__clerk/...` **404** → env proxy presente pero middleware sin `frontendApiProxy` (estado a medias).
4. Google `redirect_uri_mismatch` → URI debe coincidir con el modo (proxy vs accounts.dev).
5. Cookies / handshake → `POST /api/auth/clear-clerk` o botón en `/login`.
6. Handshake anidado → middleware corta y limpia cookies.

## Scripts

- `node scripts/set-clerk-proxy.mjs` — PATCH `proxy_url` (requiere `CLERK_SECRET_KEY` legible).
- `node scripts/clear-clerk-proxy.mjs` — `proxy_url: null`.

Nota: en Vercel las vars Clerk suelen ser **Sensitive**; `vercel env pull` no las descarga. Usar el secret desde Clerk Dashboard en local solo para esos scripts.
