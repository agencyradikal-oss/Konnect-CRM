/**
 * Identidad visual Konnect™ / KMD.
 *
 * Favicon / OG: `src/app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`
 * (ImageResponse). UI: `BrandMark` (SVG inline) + opcional `public/brand/iso.svg`.
 */
export const brand = {
  name: "Konnect",
  trademark: "Konnect™",
  markAlt: "Konnect — iso KN",
  /** Ruta pública del isotipo SVG (fallback UI / docs). */
  isoSrc: "/brand/iso.svg",
  isoPathOnDisk: "public/brand/iso.svg",
} as const;

export type BrandConfig = typeof brand;
