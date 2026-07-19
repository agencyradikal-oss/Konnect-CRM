import { MapPin } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/public/site-header";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("footer");

  const footerLinks = [
    { href: "/como-funciona", label: t("howItWorks") },
    { href: "/faq", label: t("faq") },
    { href: "/precios", label: t("pricing") },
    { href: "/developers", label: t("developers") },
    { href: "/terminos", label: t("terms") },
    { href: "/privacidad", label: t("privacy") },
    { href: "/eliminar-datos", label: t("deleteData") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p>{t("rights", { year: new Date().getFullYear() })}</p>
            <p className="flex items-center gap-1">
              <MapPin className="size-4 text-primary" /> {t("location")}
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
            {footerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-foreground hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
