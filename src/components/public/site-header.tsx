import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { PublicMobileNav } from "@/components/public/public-mobile-nav";
import { BrandWordmark } from "@/components/brand/brand-mark";

export async function SiteHeader() {
  const session = await auth();
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");

  const links = [
    { href: "/directorio", label: t("directory") },
    { href: "/precios", label: t("pricing") },
    { href: "/registrar-empresa", label: t("register") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <PublicMobileNav links={links} />
          <Link href="/" className="hover:opacity-90">
            <BrandWordmark markSize={32} />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {session?.user ? (
            <Button asChild size="sm">
              <Link
                href={
                  session.user.role === "SUPER_ADMIN"
                    ? "/admin"
                    : "/app/dashboard"
                }
              >
                {tc("dashboard")}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{tc("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{tc("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
