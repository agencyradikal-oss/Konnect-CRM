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
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              K
            </span>
            Konnect<span className="text-primary">™</span>
          </Link>
          <p className="mt-3 truncate text-sm font-medium">{business?.name}</p>
          <Badge variant="secondary" className="mt-1">
            {business?.plan}
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav newLeadsCount={newLeadsCount} />
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="border-t border-sidebar-border p-2"
        >
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </form>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <MobileNav newLeadsCount={newLeadsCount} />
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
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href={`/negocio/${business.slug}`} target="_blank">
                  Ver perfil público
                </Link>
              </Button>
            )}
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(session.user.name ?? session.user.email ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
