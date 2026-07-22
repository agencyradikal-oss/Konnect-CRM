# CRM — navegación (interno)

## Sidebar

Fuente única: [`src/components/crm/sidebar-nav.tsx`](../src/components/crm/sidebar-nav.tsx).

`MobileNav` reutiliza el mismo componente → desktop y móvil quedan alineados.

| Ítem | Ruta |
|------|------|
| Dashboard | `/app/dashboard` |
| Leads | `/app/leads` |
| Contactos | `/app/contactos` |
| Deals | `/app/deals` |
| Citas | `/app/citas` |
| Ruta del día | `/app/ruta` (Premium) |
| Tareas | `/app/tareas` |
| Analytics | `/app/analytics` |
| Mi Perfil Público | `/app/perfil` (editor CRM del listing) |
| Directorio | `/directorio` (directorio público) |
| Integraciones | `/app/integraciones` |
| Plan | `/app/plan` |

### Activo (highlight)

- Rutas `/app/*`: `pathname.startsWith(href)` (excepto dashboard, que también acepta `/app`).
- Rutas fuera del CRM (p. ej. `/directorio`): `pathname === href` o prefijo `href/`, sin marcar activo el resto del CRM.

### Layout

[`src/app/app/layout.tsx`](../src/app/app/layout.tsx): logo del sidebar → `/app/dashboard` (no al directorio).

## Directorio público (imágenes)

- Listado [`BusinessCard`](../src/components/directory/business-card.tsx): portada + logo.
- Ficha [`/negocio/[slug]`](../src/app/(public)/negocio/[slug]/page.tsx): portada full-bleed, logo junto al nombre, galería hasta **10** fotos (`gallery.slice(0, 10)`).
- Límites de subida por plan: Free 1, Pro/Premium 10 (`lib/plans.ts`).
- Navegación (atrás / breadcrumbs / sticky CTAs): [directory-nav.md](./directory-nav.md).
