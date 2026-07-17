"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadSourceBadge } from "@/components/crm/stage-badge";
import type { LeadSource } from "@prisma/client";

export type BellLead = {
  id: string;
  name: string;
  source: LeadSource;
  createdAt: string;
  message: string | null;
};

export function LeadsBell({ leads }: { leads: BellLead[] }) {
  const count = leads.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
          <span className="sr-only">Leads nuevos</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Leads nuevos (7 días)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No hay leads nuevos recientes.
          </p>
        ) : (
          leads.slice(0, 8).map((lead) => (
            <DropdownMenuItem key={lead.id} asChild>
              <Link href="/app/leads?status=NEW" className="flex flex-col items-start gap-1">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate font-medium">{lead.name}</span>
                  <LeadSourceBadge source={lead.source} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleString("es-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {lead.message ? ` · ${lead.message.slice(0, 40)}` : ""}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/leads" className="justify-center font-medium">
            Ver todos los leads
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
