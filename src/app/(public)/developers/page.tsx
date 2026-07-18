import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { developersEn, developersEs } from "@/content/developers";
import { DEVELOPERS_CONTACT } from "@/content/legal/meta";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Integraciones Konnect™: webhooks de leads, early access API, El Puente y partners.",
  alternates: { canonical: "/developers" },
};

export default async function DevelopersPage() {
  const locale = await getLocale();
  const doc = locale === "en" ? developersEn : developersEs;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="border-b pb-8">
        <Badge variant="secondary" className="mb-3">
          {doc.statusBadge}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {doc.subtitle}
        </p>
        <p className="mt-4 text-sm">
          <a
            href={`mailto:${DEVELOPERS_CONTACT}`}
            className="font-medium text-primary underline"
          >
            {DEVELOPERS_CONTACT}
          </a>
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {section.body.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            {section.code && (
              <pre className="mt-4 overflow-x-auto rounded-lg border bg-sidebar p-4 text-xs text-sidebar-foreground md:text-sm">
                <code>{section.code}</code>
              </pre>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
