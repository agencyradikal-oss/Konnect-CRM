import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Fondo detrás del iso. */
  withBackdrop?: boolean;
};

/**
 * Isotipo KN (SVG). Favicon/OG se generan en `src/app/icon.tsx` etc.
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
        withBackdrop && "bg-[#0e1b1a]",
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={brand.markAlt}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="block"
        aria-hidden
      >
        <rect width="64" height="64" rx="12" fill="#0e1b1a" />
        <rect x="9" y="9" width="46" height="46" rx="9" fill="#31c9c0" />
        <text
          x="32"
          y="43"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="34"
          fontWeight="800"
          fill="#06302d"
        >
          K
        </text>
      </svg>
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
