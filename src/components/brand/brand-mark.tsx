import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Fondo detrás del iso (útil si el PNG es blanco sobre transparente). */
  withBackdrop?: boolean;
};

/**
 * Isotipo reutilizable. Cambia el archivo en `public/brand/iso.png`
 * (ver `src/lib/brand.ts`) sin editar cada header.
 */
export function BrandMark({
  size = 32,
  className,
  withBackdrop = true,
}: BrandMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
        withBackdrop && "bg-black",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={brand.isoSrc}
        alt={brand.markAlt}
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </span>
  );
}

export function BrandWordmark({
  className,
  markSize = 32,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <BrandMark size={markSize} />
      <span className="text-lg leading-none">
        Konnect<span className="text-primary">™</span>
      </span>
    </span>
  );
}
