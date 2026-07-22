# Directorio público — navegación y responsive (interno)

## Rutas

| Ruta | Página |
|------|--------|
| `/directorio` | Listado + filtros |
| `/categoria/[slug]` | Negocios de una categoría |
| `/negocio/[slug]` | Ficha pública (El Puente) |

## Navegación

Componente: [`src/components/directory/directory-nav.tsx`](../src/components/directory/directory-nav.tsx)

- **Atrás** (`ArrowLeft`): padre lógico, no `history.back()`
  - Directorio → `/`
  - Categoría → `/directorio`
  - Negocio → `/categoria/{slug}`
- **Breadcrumb** (`nav` + `ol`):
  - Inicio › Directorio
  - Inicio › Directorio › {categoría}
  - Inicio › Directorio › {categoría} › {nombre}
- En móvil los crumbs intermedios se ocultan (`hidden sm:inline`); se muestran Inicio + página actual.
- i18n: `directory.home`, `directory.back`, `directory.breadcrumb` en `es.json` / `en.json`.

### SEO

`breadcrumbJsonLd()` emite `BreadcrumbList` en categoría y ficha de negocio (junto al `LocalBusiness` existente).

## Responsive — ficha `/negocio/[slug]`

- Título: `text-2xl sm:text-3xl`, `break-words`, contenedor `min-w-0`.
- **Llamar / WhatsApp**:
  - Desktop (`lg+`): bloque junto al encabezado.
  - Móvil (`lg:hidden`): barra fija inferior (`fixed bottom-0`) con `safe-area-inset-bottom`; página con `pb-24` para no tapar contenido.
- `ClickActions` acepta `compact` para la barra sticky ([`click-actions.tsx`](../src/components/directory/click-actions.tsx)).

## Listados

- Títulos `text-2xl sm:text-3xl`.
- Filtros del directorio: inputs y botón `w-full` en móvil, fila en `sm+`.

## Fuera de alcance

El CRM (`/app/*`) usa sidebar + `MobileNav`; no comparte este componente.
