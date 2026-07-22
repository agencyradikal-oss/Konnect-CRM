# Google + Konnect (Calendar, Maps, Business Profile)

## Resumen

Konnect es la **fuente de verdad** del CRM. Google es canal operativo (calendario del dueño, rutas Maps, ficha GBP). Sync solo con **opt-in** en `/app/integraciones`.

| Capacidad | Plan | Ruta CRM |
|-----------|------|----------|
| Citas locales + link Maps | Todos (sync Calendar = Pro+) | `/app/citas` |
| Google Calendar OAuth | Pro / Premium | `/app/integraciones` |
| Ruta del día / optimizar | Premium | `/app/ruta` |
| Sync listing → GBP | Premium | Integraciones |
| Booking público en ficha | Premium | `/negocio/[slug]` |

## Setup Google Cloud

1. Proyecto en Google Cloud → OAuth consent screen (External / Internal).
2. APIs: **Google Calendar API**, **Geocoding** (ya `GOOGLE_GEOCODING_API_KEY`), opcional **Business Profile**.
3. Credenciales OAuth **Web application**:
   - Redirect: `https://konnect.kmd.agency/api/google/oauth/callback`
4. Env (ver `.env.example`):
   - `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`
   - `TOKEN_ENCRYPTION_KEY` (recomendado)
   - `GOOGLE_GEOCODING_API_KEY`

Scopes mínimos: `calendar.events` (+ `business.manage` si GBP).

**Nota:** login Google vía Clerk ≠ esta conexión. Son consentimientos distintos.

## Modelos

- `GoogleConnection` — tokens cifrados por `businessId` + `userId`
- `Appointment` — medida/visita con dirección, `googleEventId`, `mapsUrl`, `routeOrder`
- `LeadSource.BOOKING` — reservas públicas

## Archivos clave

- OAuth: [`src/lib/google/oauth.ts`](../src/lib/google/oauth.ts), callback [`api/google/oauth/callback`](../src/app/api/google/oauth/callback/route.ts)
- Calendar / Maps / GBP: `src/lib/google/{calendar,maps,gbp,tokens}.ts`
- Actions: `appointments.ts`, `google-connect.ts`, `google-gbp.ts`, `public-booking.ts`

## Cumplimiento

- Checkbox de consentimiento al conectar (PII de clientes → Calendar).
- Privacidad / términos actualizados.
- GBP sync = perfil público del negocio, **no** leads.
- Desconectar revoca token en Google y borra `GoogleConnection`.

## Verificación OAuth

Scopes sensibles de Calendar pueden exigir **Google OAuth verification** antes de producción amplia.
