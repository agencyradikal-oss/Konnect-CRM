import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export type DirectoryCrumb = {
  label: string;
  href?: string;
};

type DirectoryNavProps = {
  /** Parent logical URL for the back arrow (not history.back). */
  backHref: string;
  backLabel?: string;
  items: DirectoryCrumb[];
  className?: string;
};

export async function DirectoryNav({
  backHref,
  backLabel,
  items,
  className,
}: DirectoryNavProps) {
  const t = await getTranslations("directory");
  const label = backLabel ?? t("back");

  return (
    <div className={cn("mb-4 space-y-2", className)}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        {label}
      </Link>

      <nav aria-label={t("breadcrumb")} className="overflow-x-auto">
        <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/70"
                    aria-hidden
                  />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "truncate hover:text-foreground hover:underline",
                      // On mobile show home + last; middle crumbs from sm+
                      index > 0 && !isLast && "hidden sm:inline",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate font-medium text-foreground",
                      isLast && "max-w-[12rem] sm:max-w-none",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

/** JSON-LD BreadcrumbList for SEO (categoría / negocio). */
export function breadcrumbJsonLd(
  baseUrl: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}
