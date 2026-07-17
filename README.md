# Konnect™ — CRM + Directorio

Plataforma que combina un **directorio empresarial público** (estilo Páginas Amarillas moderno) con un **CRM privado multi-tenant**, conectados por **El Puente**: toda interacción en el perfil público (formulario, cotización, click-to-call, WhatsApp) se registra automáticamente como Lead en el CRM del negocio con source tracking.

Mercado: Atlanta metro (comunidad hispana + anglo). UI en español primero, i18n lista para inglés.

## Stack

- **Next.js 16** (App Router) + TypeScript estricto
- **Tailwind CSS v4** + **shadcn/ui** (tema teal `#31C9C0`, dark mode)
- **Prisma ORM 6** + PostgreSQL
- **Auth.js (NextAuth v5)** — roles `SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_STAFF`
- **Stripe Billing** (Free / Pro / Premium), **Vercel Blob**, **Resend**, **next-intl**

## Desarrollo

```bash
bun install
cp .env.example .env   # completa DATABASE_URL y AUTH_SECRET
bun run db:deploy      # aplica migraciones
bun run db:seed        # categorías, negocios demo y usuarios de prueba
bun run dev
```

Usuarios seed (contraseña `Konnect2026!`):

| Email | Rol |
|---|---|
| `admin@kmd.agency` | SUPER_ADMIN |
| `dueno@granitoselaguila.com` | BUSINESS_OWNER |
| `dueno@remodelacioneshernandez.com` | BUSINESS_OWNER |

## Rutas

- Públicas: `/`, `/directorio`, `/negocio/[slug]`, `/categoria/[slug]`, `/registrar-empresa`, `/login`, `/signup`
- CRM (requiere sesión con negocio): `/app/dashboard`, `/app/leads`, `/app/contactos`, `/app/deals`, `/app/tareas`, `/app/perfil`, `/app/plan`
- Admin (SUPER_ADMIN): `/admin`

## Variables de entorno

Ver [.env.example](.env.example): `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
