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

const items = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/leads", label: "Leads", icon: Inbox },
  { href: "/app/contactos", label: "Contactos", icon: Users },
  { href: "/app/deals", label: "Deals", icon: Handshake },
  { href: "/app/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/app/perfil", label: "Perfil público", icon: Store },
  { href: "/app/plan", label: "Plan", icon: CreditCard },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
