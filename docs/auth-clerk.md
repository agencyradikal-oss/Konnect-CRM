# Auth Clerk (interno)

Documento operativo para el equipo. No sustituye la sección Auth del [README](../README.md).

## Arquitectura actual

- Auth: **Clerk** (email/password + Google OAuth).
- Roles / tenant: **Prisma** (`User.role`, `User.businessId`, `User.clerkUserId`).
- Sync: webhook `/api/webhooks/clerk` + `upsertUserFromClerk` en login/`auth()`.
- UI ES: `localization={esES}` en `KonnectClerkProvider`.

```
Browser → ClerkJS → FAPI
                ↘ (si FAPI custom sin DNS)
                  /__clerk proxy (middleware frontendApiProxy)
Server  → clerkMiddleware / auth() → Prisma User
```

## Estado del dominio FAPI (crítico)

La publishable key de Production apunta a un **Frontend API custom** (`clerk.konnect.kmd.agency` o `clerk.kmd.agency`) **sin DNS**.

Mientras eso sea así:

| Pieza | Valor |
|-------|--------|
| `NEXT_PUBLIC_CLERK_PROXY_URL` (Vercel) | `https://konnect.kmd.agency/__clerk` |
| Clerk Dashboard → Domains → Set proxy | misma URL |
| Google OAuth redirect URI | `https://konnect.kmd.agency/__clerk/v1/oauth_callback` |
| Código | `frontendApiProxy` + `proxyUrl` en middleware y `ClerkProvider` |

Sin proxy: `ERR_NAME_NOT_RESOLVED` al cargar `clerk.browser.js`.

### Objetivo estable

1. Clerk Dashboard → Domains → **quitar** Frontend API custom.
2. Usar FAPI default `*.clerk.accounts.dev`.
3. Actualizar keys en Vercel si Clerk las rota.
4. Quitar `NEXT_PUBLIC_CLERK_PROXY_URL` y el código de proxy.
5. Google redirect URI = la que muestre Clerk SSO (no `/__clerk/...`).

Scripts:

- `node scripts/set-clerk-proxy.mjs` — PATCH `proxy_url` (requiere `CLERK_SECRET_KEY`).
- `node scripts/clear-clerk-proxy.mjs` — deja `proxy_url` en `null`.

## Endpoints de diagnóstico

### `GET /api/auth/status`

No confundir “sin sesión Clerk” con “DB caída”.

| Respuesta | Significado |
|-----------|-------------|
| `clerk: "missing"`, `prisma: "skipped"` | No hay `userId` Clerk en el servidor. Prisma **no se consultó**. |
| `clerk: "ok"`, `prisma: "ok"` | Sesión Clerk + fila Prisma. |
| `clerk: "ok"`, `prisma: "missing_user"` | Clerk OK; falta sync Prisma → usar `POST /api/auth/sync`. |
| `clerk: "ok"`, `prisma: "error"` | Fallo real al hablar con Prisma / sync. |

Campos legacy (`clerkHasUserId`, `prismaOk`) se mantienen por compatibilidad.

### `POST /api/auth/clear-clerk`

Expira cookies Clerk **incluyendo HttpOnly `__session`**. Usar cuando el cliente cree estar firmado y el servidor no.

### `POST /api/auth/sync`

Fuerza `auth()` (upsert Prisma desde Clerk) cuando ya hay `userId`.

## Flujo post-login: `/auth/continue`

1. Server: si `auth()` ya tiene usuario → redirect a dashboard o `/registrar-empresa`.
2. Si no: `AuthContinueClient` hace **8 intentos × 750 ms** contra `/api/auth/status`.
3. Solo avanza si `clerk === "ok"` en **servidor** (no confiar solo en `useAuth().isSignedIn`).
4. Si agota reintentos → botón hard reset (clear cookies + `signOut` + `/login`).

Síntoma típico de desync: mensaje “esperando sesión en el servidor…” / “El servidor no recibió la sesión”.

## Header público vs cliente

- `SiteHeader` usa `auth()` **server-side** para “Mi panel”.
- No mostrar estado logueado solo con `useAuth().isSignedIn` del browser.

## Checklist de incidentes

1. Consola: ¿`ERR_NAME_NOT_RESOLVED` a `clerk.*.kmd.agency`? → proxy / DNS / quitar custom FAPI.
2. Google `redirect_uri_mismatch` → URI en Google Cloud debe coincidir con Clerk (proxy o accounts.dev).
3. `/api/auth/status` → mirar `clerk` primero; `prisma: skipped` **no** es Neon caído.
4. Cookies mezcladas / handshake → `POST /api/auth/clear-clerk` o botón en `/login`.
5. Handshake anidado (`session-token-but-no-client-uat`) → middleware corta URL anidada y limpia cookies.
