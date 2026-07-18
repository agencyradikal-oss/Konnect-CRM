"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Handshake,
  CheckSquare,
  Store,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const items = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/leads", label: "Leads", icon: Inbox, showNewBadge: true },
  { href: "/app/contactos", label: "Contactos", icon: Users },
  { href: "/app/deals", label: "Deals", icon: Handshake },
  { href: "/app/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/app/perfil", label: "Mi Perfil Público", icon: Store },
  { href: "/app/plan", label: "Plan", icon: CreditCard },
] as const;

export function SidebarNav({
  onNavigate,
  newLeadsCount = 0,
}: {
  onNavigate?: () => void;
  newLeadsCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const showBadge =
          "showNewBadge" in item && item.showNewBadge && newLeadsCount > 0;
        const active =
          href === "/app/dashboard"
            ? pathname === href || pathname === "/app"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {showBadge && (
              <Badge className="h-5 min-w-5 justify-center rounded-full bg-sidebar-foreground px-1.5 text-[10px] text-sidebar">
                {newLeadsCount > 99 ? "99+" : newLeadsCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
