# Home — hero (interno)

## Título rotativo de ciudad

Componente: [`src/components/public/hero-rotating-title.tsx`](../src/components/public/hero-rotating-title.tsx)  
Página: [`src/app/(public)/page.tsx`](../src/app/(public)/page.tsx)

### Copy (i18n)

| Locale | Clave `home.title` |
|--------|--------------------|
| ES | `Encuentra negocios en crecimiento en <highlight>{city}</highlight>` |
| EN | `Find growing businesses in <highlight>{city}</highlight>` |

Archivos: `src/i18n/messages/es.json`, `en.json`.

### Fuente de ciudades

- `prisma.business.groupBy({ by: ["city"] })` sobre negocios `status: ACTIVE` con `city` no nula.
- Orden: más negocios por ciudad primero.
- Fallback: `["Atlanta"]` si no hay datos o falla la DB.
- Rotación en cliente cada ~2.8s (solo si hay ≥2 ciudades).

Al publicar negocios en nuevas ciudades, el hero las incluye automáticamente.
