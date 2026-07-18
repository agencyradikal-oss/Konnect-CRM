/**
 * Identidad visual Konnect™ / KMD.
 *
 * Para cambiar el iso o favicon:
 * 1. Reemplaza `public/brand/iso.png` (PNG preferido, fondo transparente o negro).
 * 2. Opcional: ajusta `name`, `markAlt` abajo.
 * No hace falta tocar componentes: BrandMark y metadata leen de aquí.
 */
export const brand = {
  name: "Konnect",
  trademark: "Konnect™",
  markAlt: "Konnect — iso KMD",
  /** Ruta pública del isotipo (favicon + logo en UI). */
  isoSrc: "/brand/iso.png",
  /** Tamaños sugeridos del archivo fuente: 512×512 o mayor. */
  isoPathOnDisk: "public/brand/iso.png",
} as const;

export type BrandConfig = typeof brand;
