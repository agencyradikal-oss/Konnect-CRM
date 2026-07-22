# Konnect™ — CRM + Directorio

Plataforma en [konnect.kmd.agency](https://konnect.kmd.agency) que combina un **directorio empresarial público** (Páginas Amarillas moderno) con un **CRM privado multi-tenant**, unidos por **El Puente**: toda interacción en el perfil público (formulario, cotización, click-to-call, WhatsApp) se registra automáticamente como **Lead** en el CRM del negocio, con **source tracking**.

**Mercado:** Atlanta metro (comunidad hispana + anglo).  
**Idioma:** español primero; i18n lista para inglés (`next-intl`).

Repo: [agencyradikal-oss/Konnect-CRM](https://github.com/agencyradikal-oss/Konnect-CRM)

---

## Tres pilares

1. **Directorio público** — perfiles de empresa, búsqueda por categoría/ciudad, reseñas, contacto, SEO.
2. **CRM multi-tenant** — leads, contactos, deals (Kanban), tareas, actividades, analytics (Premium).
3. **El Puente** — el diferenciador: la acción pública nunca se pierde; siempre llega al CRM con origen (`DIRECTORY_FORM`, `QUOTE_REQUEST`, `CLICK_CALL`, `CLICK_WHATSAPP`, etc.).

---

## Stack

| Capa | Tecnología |
|------|------------|
| App | Next.js 16 (App Router) + TypeScript estricto |
| UI | Tailwind CSS v4 + shadcn/ui (teal `#31C9C0`) |
| DB | Prisma ORM 6 + PostgreSQL (Neon) |
| Auth | Clerk — email/password + Google OAuth (roles en Prisma) |
| Billing | Stripe Billing — Free / Pro ($19) / Premium ($49) |
| Media | Vercel Blob (logos, portada, galería) |
| Email | Resend + react-email |
| i18n | next-intl (`es` / `en`, cookie `NEXT_LOCALE`) |
| Deploy | Vercel (`output: "standalone"`) |

**Patrones:** Server Components por defecto; mutaciones vía Server Actions; validación Zod en todas las entradas; `"use client"` solo cuando hace falta.

---

## Roles

| Rol | Acceso |
|-----|--------|
| `SUPER_ADMIN` | Panel `/admin` (aprobar negocios, moderar reseñas) |
| `BUSINESS_OWNER` | CRM del negocio + facturación |
| `BUSINESS_STAFF` | CRM del negocio (sin ownership) |

El tenant se resuelve con `session.user.businessId` → `getCurrentBusiness()` / `requireBusinessSession()`.

---

## Desarrollo local

```bash
npm install
cp .env.example .env   # DATABASE_URL + claves Clerk
npm run db:deploy      # aplica migraciones
npm run db:seed        # categorías, negocios demo, usuarios Prisma
npm run dev            # http://localhost:3000
```

También puedes usar `bun` si lo prefieres (`bun install`, `bun run dev`, etc.).

### Auth (Clerk)

1. App en [dashboard.clerk.com](https://dashboard.clerk.com) con keys **Production** en Vercel.
2. Email + Google OAuth.
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (misma instancia).
4. Webhook → `https://konnect.kmd.agency/api/webhooks/clerk` → `CLERK_WEBHOOK_SIGNING_SECRET`.
5. **Temporal mientras exista FAPI custom sin DNS** (`clerk.konnect.kmd.agency`):
   - Vercel: `NEXT_PUBLIC_CLERK_PROXY_URL=https://konnect.kmd.agency/__clerk`
   - Clerk Domains → **Set proxy** = esa misma URL  
     (`node scripts/set-clerk-proxy.mjs` con `CLERK_SECRET_KEY`)
   - Google redirect URI: `https://konnect.kmd.agency/__clerk/v1/oauth_callback`
6. **Objetivo estable:** quitar el Frontend API custom en Clerk y usar
   `*.clerk.accounts.dev` (entonces elimina proxy env + código de proxy).
7. Vercel: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`.
8. Cookies rotas: `POST /api/auth/clear-clerk` o el botón en `/login`.
9. Health: `GET /api/auth/status` → `{ clerk: "missing"|"ok", prisma: "skipped"|"ok"|… }`.

### Usuarios seed

El seed crea filas Prisma (roles/tenant). Para login, crea el mismo email en Clerk (o regístrate en `/signup`); al vincular por email hereda rol/`businessId`.

| Email | Rol |
|-------|-----|
| `admin@kmd.agency` | SUPER_ADMIN |
| `dueno@granitoselaguila.com` | BUSINESS_OWNER |
| `dueno@remodelacioneshernandez.com` | BUSINESS_OWNER |

### Scripts npm

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `ensure-unpooled` → `prisma generate` → `db-prepare` → `next build` |
| `npm run start` | Servidor de producción local |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Seed de demo |
| `npm run db:studio` | Prisma Studio |
| `npm run stripe:products` | Crea productos/precios Pro y Premium en Stripe |

Health check: `GET /api/health`

---

## Variables de entorno

Copia [.env.example](.env.example). Resumen:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Postgres pooled (Neon pooler) — runtime |
| `DATABASE_URL_UNPOOLED` | Sí (prod) | Postgres directo — migraciones / `db push` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sí | Publishable key Clerk |
| `CLERK_SECRET_KEY` | Sí | Secret key Clerk |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Sí (prod) | Firma webhook Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Prod | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Prod | `/signup` |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | Si FAPI custom sin DNS | `https://konnect.kmd.agency/__clerk` + Set proxy en Clerk |
| `NEXT_PUBLIC_APP_URL` | Sí | URL pública sin slash final |
| `GOOGLE_GEOCODING_API_KEY` | No | Si falta, geocode usa Nominatim |
| `STRIPE_SECRET_KEY` | Billing | `sk_test_…` o `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Billing | `whsec_…` del endpoint de webhook |
| `STRIPE_PRICE_PRO` | Billing | Price ID Pro |
| `STRIPE_PRICE_PREMIUM` | Billing | Price ID Premium |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | Uploads | Token rw del store Blob **público** |
| `BLOB_PUBLIC_STORE_ID` | Uploads | ID del store público (OIDC / multi-store) |
| `BLOB_PUBLIC_WEBHOOK_PUBLIC_KEY` | Opcional | Verificar webhooks de client uploads |
| `RESEND_API_KEY` | Emails | Resend (sin key, los emails se omiten con log) |
| `CRON_SECRET` | Cron | Bearer para `/api/cron/weekly-leads` |

En Neon: usa la connection string **pooled** en `DATABASE_URL` y la **direct** en `DATABASE_URL_UNPOOLED`.

### Vercel Blob (store público)

Los uploads del directorio (logo, portada, galería) usan el patrón de la doc de Vercel:

1. Cliente comprime la imagen y hace `POST /api/blob/upload?filename=…&folder=logo` con el body = File.
2. La ruta (auth requerida) llama a `putPublicBlob` con `BLOB_PUBLIC_*`.
3. El formulario guarda solo la **URL** resultante (evita el límite ~4.5 MB de Server Actions).

Helper cliente: `src/lib/upload-public-image.ts`. Env:

- `BLOB_PUBLIC_READ_WRITE_TOKEN`
- `BLOB_PUBLIC_STORE_ID`
- `BLOB_PUBLIC_WEBHOOK_PUBLIC_KEY` (reservado para client uploads / verificación de webhooks)

Sigue habiendo fallback a `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` si aún no migraste los nombres.

---

## Rutas

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Home: búsqueda, categorías, destacados |
| `/directorio` | Listado con filtros `q` / `ciudad` |
| `/negocio/[slug]` | Perfil público + El Puente + reseñas + JSON-LD |
| `/categoria/[slug]` | Negocios por categoría |
| `/precios` | Planes Free / Pro / Premium |
| `/como-funciona` | How it works — pilares, pasos, El Puente |
| `/faq` | Preguntas frecuentes |
| `/developers` | Integraciones y early access API |
| `/terminos` | Términos y condiciones |
| `/privacidad` | Política de privacidad |
| `/registrar-empresa` | Wizard de onboarding (logo/portada) |
| `/login`, `/signup` | Auth |

SEO: `sitemap.xml`, `robots.txt` (bloquea `/app/`, `/admin/`, `/api/`).

### CRM (`/app/*` — sesión + `businessId`)

| Ruta | Descripción |
|------|-------------|
| `/app/dashboard` | Métricas y gráficos |
| `/app/leads` | Inbox de leads (badge NEW, locking Free) |
| `/app/contactos` | Contactos + import CSV (Pro+) |
| `/app/deals` | Pipeline Kanban |
| `/app/tareas` | Tareas agrupadas |
| `/app/analytics` | Vistas de perfil (Premium) |
| `/app/perfil` | Editar perfil público / galería |
| `/app/plan` | Plan y portal Stripe |
| `/app/integraciones` | Stripe plan, webhook lead.created, Square/QB roadmap |

### Admin

| Ruta | Descripción |
|------|-------------|
| `/admin` | Moderación: aprobar/suspender negocios, reseñas, métricas de usuarios |
| `/admin/usuarios` | Gestión CRM: crear usuarios, roles, asignar tenant, activar/desactivar, reset password |

### Marca (favicon + iso)

Un solo archivo: `public/brand/iso.png`. Config en `src/lib/brand.ts`. El componente `BrandMark` / `BrandWordmark` lo usa en header público, CRM y admin. Para cambiar el logo: reemplaza ese PNG (ideal 512×512).

### APIs

| Ruta | Descripción |
|------|-------------|
| `/api/webhooks/clerk` | Sync usuarios Clerk → Prisma |
| `/api/webhooks/stripe` | Webhook Stripe (firma requerida) |
| `/api/cron/weekly-leads` | Resumen semanal de leads (cron) |
| `/api/health` | Diagnóstico DB / env |

---

## El Puente (leads públicos → CRM)

Server Actions en `src/actions/bridge.ts`:

- `createLeadFromDirectory` — formulario / cotización (Zod + rate limit + email al negocio).
- `trackContactClick` — click-to-call / WhatsApp (lead mínimo).

Reseñas: `src/actions/reviews.ts` → `submitReview` (sanitizado, `approved: false` hasta moderación en admin).

Analítica pública: `trackProfilePageView` → modelo `PageView`.

---

## Planes (Stripe)

Definidos en `src/lib/plans.ts`:

| Plan | Precio | Límites clave |
|------|--------|----------------|
| **Free** | $0 | 20 leads visibles/mes (se guardan todos), 1 foto, 1 usuario |
| **Pro** | $19/mes | CRM ilimitado, 10 fotos, CSV, verificado elegible, 3 usuarios |
| **Premium** | $49/mes | Destacado en directorio, analytics, 10 usuarios |

Checkout y Customer Portal: `src/actions/billing.ts`.  
Webhook: `src/app/api/webhooks/stripe/route.ts`.

Crear precios en Stripe:

```bash
# con STRIPE_SECRET_KEY en el entorno
npm run stripe:products
```

Copia los `price_…` resultantes a `STRIPE_PRICE_PRO` y `STRIPE_PRICE_PREMIUM`.

---

## Emails (Resend + react-email)

Templates en `src/emails/`, envío en `src/lib/email.tsx`:

| Email | Cuándo |
|-------|--------|
| Bienvenida | Signup (`sendWelcomeEmail`) |
| Negocio aprobado | Admin aprueba → ACTIVE |
| Nuevo lead | Formulario/cotización del puente |
| Resumen semanal | Cron lunes |

From: `Konnect <notificaciones@kmd.agency>` (dominio verificado en Resend).

### Cron semanal

`vercel.json`:

```json
{ "path": "/api/cron/weekly-leads", "schedule": "0 12 * * 1" }
```

≈ lunes 8:00 America/New_York (12:00 UTC).  
Auth: `Authorization: Bearer ${CRON_SECRET}`.

---

## i18n

- Mensajes: `src/i18n/messages/es.json`, `en.json`
- Locale por cookie `NEXT_LOCALE` (`src/i18n/request.ts` + `src/actions/locale.ts`)
- Switcher ES/EN en el header público (`LocaleSwitcher`)

---

## Seguridad

- Server Actions del CRM: sesión + tenant (`getCurrentBusiness` / `requireBusinessSession`).
- Admin: `requireSuperAdmin()`.
- Inputs de reseñas, mensajes y notas: `sanitizeUserText` (`src/lib/sanitize.ts`).
- Login: `callbackUrl` solo paths relativos (anti open-redirect).
- Headers en `next.config.ts`: HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Stripe webhook: verificación de firma obligatoria.
- Rate limit en formularios públicos de lead/reseña.

Loading skeletons + `error.tsx` en rutas públicas, CRM y admin; `not-found.tsx` global.

---

## Redirects 301 (WordPress)

En `next.config.ts` (ejemplos):

| Origen | Destino |
|--------|---------|
| `/directory`, `/negocios` | `/directorio` |
| `/pricing`, `/planes` | `/precios` |
| `/listing/:slug`, `/business/:slug` | `/negocio/:slug` |
| `/category/:slug` | `/categoria/:slug` |
| `/wp-admin/*`, `/wp-login.php` | `/` o `/login` |

Ajusta la lista cuando tengas el export real de URLs del WP anterior.

---

## Deploy en Vercel

1. Conectar el repo `Konnect-CRM` (branch `main`).
2. Configurar **todas** las env vars de producción (tabla arriba).
3. Dominio: Settings → Domains → `konnect.kmd.agency` (DNS A/CNAME de Vercel; retirar el WP).
4. Stripe **live**:
   - Productos/precios live (`npm run stripe:products` con `sk_live_…`).
   - Webhook: `https://konnect.kmd.agency/api/webhooks/stripe`
   - Eventos de suscripción (checkout, invoice, customer.subscription.*).
   - Copiar signing secret → `STRIPE_WEBHOOK_SECRET`.
5. Resend: dominio `kmd.agency` verificado; `RESEND_API_KEY` de prod.
6. Cron: definir `CRON_SECRET` (Vercel Cron lo invoca con el header en Hobby+/Pro según plan).
7. Verificar `/api/health` y un flujo: signup → registrar negocio → lead desde perfil → email.

`AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben ser `https://konnect.kmd.agency` en producción.

---

## Estructura del proyecto (resumen)

```
konnect/
├── prisma/                 # schema, migraciones, seed
├── scripts/                # db-prepare, stripe products, ensure-unpooled
├── src/
│   ├── actions/            # Server Actions (auth, bridge, crm, billing, admin…)
│   ├── app/
│   │   ├── (public)/       # home, directorio, negocio, precios…
│   │   ├── app/            # CRM
│   │   ├── admin/          # SUPER_ADMIN
│   │   └── api/            # auth, stripe webhook, cron, health
│   ├── components/         # UI pública, CRM, shadcn
│   ├── emails/             # react-email templates
│   ├── i18n/               # next-intl messages + request config
│   └── lib/                # prisma, auth, plans, email, sanitize, tenant…
├── next.config.ts          # headers, redirects WP, images, next-intl
└── vercel.json             # cron semanal
```

---

## Licencia / marca

Konnect™ · KMD Agency · Atlanta metro, Georgia.
