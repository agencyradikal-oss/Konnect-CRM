import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/crm/sidebar-nav";
import { MobileNav } from "@/components/crm/mobile-nav";
import { LeadsBell } from "@/components/crm/leads-bell";
import { BrandWordmark } from "@/components/brand/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // #region agent log
  fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "11ae6f",
    },
    body: JSON.stringify({
      sessionId: "11ae6f",
      runId: "pre-fix",
      hypothesisId: "D",
      location: "app/app/layout.tsx:gate",
      message: "crm-layout-auth-gate",
      data: {
        hasSession: Boolean(session?.user),
        role: session?.user?.role ?? null,
        hasBusinessId: Boolean(session?.user?.businessId),
        willRedirectLogin: !session?.user,
        willRedirectRegistrar: Boolean(session?.user && !session.user.businessId),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!session?.user) redirect("/login?callbackUrl=/app/dashboard");
  if (!session.user.businessId) redirect("/registrar-empresa");

  const businessId = session.user.businessId;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const initials = (session.user.name ?? session.user.email ?? "?")
    .charAt(0)
    .toUpperCase();

  const [business, newLeadsCount, recentNewLeads] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, plan: true, status: true, slug: true },
    }),
    prisma.lead.count({
      where: { businessId, status: "NEW" },
    }),
    prisma.lead.findMany({
      where: {
        businessId,
        status: "NEW",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        source: true,
        createdAt: true,
        message: true,
      },
    }),
  ]);

  const bellLeads = recentNewLeads.map((l) => ({
    id: l.id,
    name: l.name,
    source: l.source,
    createdAt: l.createdAt.toISOString(),
    message: l.message,
  }));

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-4">
          <Link href="/app/dashboard" className="hover:opacity-90">
            <BrandWordmark markSize={36} />
          </Link>
          <p className="mt-4 truncate text-sm font-medium text-sidebar-foreground">
            {business?.name}
          </p>
          <Badge
            variant="secondary"
            className="mt-1.5 border-0 bg-sidebar-accent text-sidebar-foreground/90"
          >
            Plan {business?.plan}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav newLeadsCount={newLeadsCount} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session.user.name ?? "Usuario"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {session.user.email}
              </p>
            </div>
          </div>
          <SignOutButton
            showIcon
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
            <MobileNav newLeadsCount={newLeadsCount} />
            <p className="truncate text-sm font-medium md:hidden">
              {business?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LeadsBell leads={bellLeads} />
            {business?.status === "PENDING" && (
              <Badge
                variant="outline"
                className="hidden border-amber-500 text-amber-600 sm:inline-flex"
              >
                Pendiente de aprobación
              </Badge>
            )}
            {business?.slug && business.status === "ACTIVE" && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href={`/negocio/${business.slug}`} target="_blank">
                  Ver perfil público
                </Link>
              </Button>
            )}
            <Avatar className="size-8 md:hidden">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
