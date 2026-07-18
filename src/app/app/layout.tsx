import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/crm/sidebar-nav";
import { MobileNav } from "@/components/crm/mobile-nav";
import { LeadsBell } from "@/components/crm/leads-bell";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
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

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-4">
          <Link href="/app/dashboard" className="flex items-center gap-2.5 font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground shadow-sm">
              K
            </span>
            <span>
              Konnect<span className="text-primary">™</span>
            </span>
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
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </Button>
          </form>
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
