import type { LegalDoc } from "@/content/legal/meta";

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="border-b pb-8">
        <p className="text-sm text-muted-foreground">
          {doc.effectiveLabel} {doc.effectiveDate} · {doc.entity}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{doc.intro}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {doc.counselNote} {doc.contactLabel}:{" "}
          <a
            href={`mailto:${doc.contactEmail}`}
            className="text-primary underline"
          >
            {doc.contactEmail}
          </a>
          .
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets.map((b) => (
                    <li key={b.slice(0, 48)}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
