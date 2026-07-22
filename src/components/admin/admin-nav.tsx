"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Gift, MessageSquareText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Moderación", icon: Building2, exact: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/socios", label: "Socios", icon: Gift },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <span className="hidden items-center gap-2 px-3 py-2 text-xs text-muted-foreground sm:inline-flex">
        <MessageSquareText className="size-3.5" />
        CRM · tenants
      </span>
    </nav>
  );
}
