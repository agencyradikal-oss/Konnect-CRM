import type { ComponentType } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { BusinessSocials, SocialNetworkKey } from "@/lib/business-socials";
import { socialsList } from "@/lib/business-socials";
import { cn } from "@/lib/utils";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M16.6 5.82a4.53 4.53 0 0 1-1.3-3.32h-3.08v12.4a2.54 2.54 0 1 1-1.8-2.45V9.3a5.62 5.62 0 1 0 4.18 5.43V9.33a7.55 7.55 0 0 0 4.4 1.4V7.66a4.53 4.53 0 0 1-2.4-1.84Z" />
    </svg>
  );
}

const ICONS: Record<SocialNetworkKey, ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
  linkedin: Linkedin,
};

export function BusinessSocialLinks({
  socials,
  className,
}: {
  socials: BusinessSocials;
  className?: string;
}) {
  const items = socialsList(socials);
  if (items.length === 0) return null;

  return (
    <ul className={cn("mt-3 flex flex-wrap gap-2", className)}>
      {items.map(({ key, label, href }) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex size-10 items-center justify-center rounded-lg border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Icon className="size-5" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
