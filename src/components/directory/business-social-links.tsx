import type { ComponentType } from "react";
import type { BusinessSocials, SocialNetworkKey } from "@/lib/business-socials";
import { socialsList } from "@/lib/business-socials";
import { cn } from "@/lib/utils";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M14 13.5h2.5l.5-3H14v-1.9c0-.9.2-1.4 1.5-1.4H17V4.1C16.5 4 15.4 4 14.2 4 11.6 4 10 5.5 10 8.2V10.5H7.5v3H10V20h4v-6.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 7.3A4.7 4.7 0 1 0 16.7 12 4.71 4.71 0 0 0 12 7.3Zm0 7.7A3 3 0 1 1 15 12a3 3 0 0 1-3 3Zm5.9-7.9a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1ZM21 7.1a5.8 5.8 0 0 0-1.6-4.1A5.8 5.8 0 0 0 15.3 1.4c-1.6-.1-6.4-.1-8 0A5.82 5.82 0 0 0 3.2 3A5.8 5.8 0 0 0 1.6 7.1c-.1 1.6-.1 6.4 0 8A5.8 5.8 0 0 0 3.2 19.2 5.8 5.8 0 0 0 7.3 20.8c1.6.1 6.4.1 8 0a5.8 5.8 0 0 0 4.1-1.6 5.8 5.8 0 0 0 1.6-4.1c.1-1.6.1-6.4 0-8Zm-2.2 9.7a3.4 3.4 0 0 1-1.9 1.9c-1.3.5-4.4.4-5.9.4s-4.6.1-5.9-.4a3.4 3.4 0 0 1-1.9-1.9c-.5-1.3-.4-4.4-.4-5.9s-.1-4.6.4-5.9a3.4 3.4 0 0 1 1.9-1.9c1.3-.5 4.4-.4 5.9-.4s4.6-.1 5.9.4a3.4 3.4 0 0 1 1.9 1.9c.5 1.3.4 4.4.4 5.9s.1 4.6-.4 5.9Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6.9 8.7H3.8V20h3.1V8.7ZM5.35 4A1.8 1.8 0 1 0 5.36 7.6 1.8 1.8 0 0 0 5.35 4ZM20.2 13.2c0-3.2-1.7-4.7-4-4.7a3.45 3.45 0 0 0-3.1 1.7h-.05V8.7H10V20h3.1v-5.6c0-1.5.3-2.9 2.1-2.9s1.8 1.7 1.8 3V20H20.2v-6.8Z" />
    </svg>
  );
}

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
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
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
              className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label={label}
            >
              <Icon className="size-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
