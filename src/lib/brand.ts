/**
 * Identidad visual Konnect™ / KMD.
 *
 * Iso heredado de KMD Agency: dragón Komodo (`public/brand/iso.png`).
 * No sustituir por monograma/letra inventada.
 *
 * Favicon: `src/app/icon.png` · Apple: `src/app/apple-icon.png`
 * Share OG: `opengraph-image.tsx` (fondo claro + iso KMD `iso.png`).
 */
export const brand = {
  name: "Konnect",
  trademark: "Konnect™",
  markAlt: "Konnect — iso KMD",
  /** Ruta pública del isotipo (favicon + logo en UI + OG). */
  isoSrc: "/brand/iso.png",
  /** PNG rojo KMD (asset legado; OG usa iso + fondo claro). */
  ogSrc: "/brand/og.png",
  isoPathOnDisk: "public/brand/iso.png",
} as const;

export type BrandConfig = typeof brand;
