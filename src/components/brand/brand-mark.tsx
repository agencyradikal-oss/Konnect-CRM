import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Fondo detrás del iso (PNG blanco sobre transparente/negro). */
  withBackdrop?: boolean;
};

/**
 * Isotipo KMD (dragón Komodo). Archivo: `public/brand/iso.png`.
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
