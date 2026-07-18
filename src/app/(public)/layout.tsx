import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/public/site-header";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("footer");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-1">
            <MapPin className="size-4 text-primary" /> {t("location")}
          </p>
        </div>
      </footer>
    </div>
  );
}
