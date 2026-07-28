import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getBusinessPlanLimits } from "@/lib/plans";
import { getAppBaseUrl } from "@/lib/app-url";
import { profileScore } from "@/lib/marketing/profile-score";
import { templatesForSet } from "@/lib/marketing/templates";
import { leadSourceLabels } from "@/components/crm/stage-badge";
import { MarketingFollowUpPanel } from "@/components/crm/marketing-follow-up-panel";
import { CopyProfileLinkButton } from "@/components/crm/copy-profile-link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@prisma/client";

export const metadata = { title: "Marketing" } satisfies Metadata;
export const dynamic = "force-dynamic";

const TIPS = [
  {
    title: "WhatsApp primero (comunidad hispana)",
    body: "Pon tu WhatsApp visible en la ficha y responde rápido. Muchos clientes en Atlanta prefieren mensaje antes que llamada.",
  },
  {
    title: "CTA claro en inglés y español",
    body: "Usa frases cortas: “Cotiza gratis” / “Free quote”. El formulario del directorio ya crea el lead en tu CRM (El Puente).",
  },
  {
    title: "Fotos reales del trabajo",
    body: "Galería con trabajos locales genera más confianza que stock. Sube al menos 3–5 fotos en Perfil.",
  },
];

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; contactId?: string }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  const limits = getBusinessPlanLimits(business);
  const params = await searchParams;

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [leads30, recentLeads, contacts, emailsUsed, recentOutreach] =
    await Promise.all([
      prisma.lead.findMany({
        where: { businessId, createdAt: { gte: thirtyDaysAgo } },
        select: { source: true },
      }),
      prisma.lead.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          dealId: true,
        },
      }),
      prisma.contact.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.outreachLog.count({
        where: {
          businessId,
          channel: "email",
          createdAt: { gte: monthStart },
        },
      }),
      prisma.outreachLog.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const { score, checklist } = profileScore({
    logoUrl: business.logoUrl,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    city: business.city,
    categoryId: business.categoryId,
    gallery: business.gallery,
    hours: business.hours,
    verified: business.verified,
    featured: business.featured,
  });

  const sourceCounts = new Map<LeadSource, number>();
  for (const lead of leads30) {
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
  }
  const sourceRows = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      label: leadSourceLabels[source] ?? source,
      count,
    }));

  const recipients = [
    ...recentLeads
      .filter((l) => l.email || l.phone)
      .map((l) => ({
        kind: "lead" as const,
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        dealId: l.dealId,
      })),
    ...contacts
      .filter((c) => c.email || c.phone)
      .map((c) => ({
        kind: "contact" as const,
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        dealId: null,
      })),
  ];

  const prefillKey = params.leadId
    ? `lead:${params.leadId}`
    : params.contactId
      ? `contact:${params.contactId}`
      : undefined;
  const profileUrl = `${getAppBaseUrl()}/negocio/${business.slug}`;
  const templates = templatesForSet(limits.followUpTemplateSet);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Megaphone className="size-6 text-primary" />
            Marketing
          </h1>
          <p className="text-muted-foreground">
            Mejora tu visibilidad en el directorio y da seguimiento 1:1 a leads
            y contactos.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/plan">Ver plan</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visibilidad del perfil</CardTitle>
            <CardDescription>
              Completa tu ficha para aparecer mejor en búsquedas locales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold tabular-nums text-primary">
                {score}
              </p>
              <p className="pb-1 text-sm text-muted-foreground">/ 100</p>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {business.verified ? (
                  <Badge>Verificado</Badge>
                ) : limits.verifiedEligible ? (
                  <Badge variant="outline">Elegible Verificado</Badge>
                ) : (
                  <Badge variant="outline">Verificado en Pro+</Badge>
                )}
                {business.featured || limits.featured ? (
                  <Badge variant={business.featured ? "default" : "outline"}>
                    {business.featured ? "Destacado" : "Destacado Premium"}
                  </Badge>
                ) : (
                  <Badge variant="outline">Destacado = Premium</Badge>
                )}
              </div>
            </div>

            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                      item.done
                        ? "text-muted-foreground"
                        : "font-medium text-foreground",
                    )}
                  >
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <CopyProfileLinkButton url={profileUrl} />

            {!limits.featured && (
              <p className="text-xs text-muted-foreground">
                Tip Premium: el badge Destacado prioriza tu ficha en el
                directorio.{" "}
                <Link href="/app/plan" className="text-primary underline">
                  Actualizar plan
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por fuente (30 días)</CardTitle>
            <CardDescription>
              Cómo llega la gente desde tu perfil público (El Puente).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sourceRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin leads en los últimos 30 días. Comparte tu ficha o mejora el
                perfil.
              </p>
            ) : (
              <ul className="space-y-2">
                {sourceRows.map((row) => (
                  <li
                    key={row.source}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold tabular-nums">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/app/leads">Ver leads</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tips Atlanta (ES / EN)</CardTitle>
          <CardDescription>
            Ideas cortas para la comunidad hispana y anglo del metro.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {TIPS.map((tip) => (
            <div key={tip.title} className="space-y-1">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-sm text-muted-foreground">{tip.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <MarketingFollowUpPanel
        recipients={recipients}
        templates={templates}
        businessName={business.name}
        emailsUsed={emailsUsed}
        emailsLimit={limits.followUpEmailsPerMonth}
        prefillKey={prefillKey}
      />

      {recentOutreach.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentOutreach.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
                >
                  <span>
                    <Badge variant="secondary" className="mr-2">
                      {o.channel}
                    </Badge>
                    {o.templateKey}
                    {o.toValue ? ` → ${o.toValue}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {o.createdAt.toLocaleString("es-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
