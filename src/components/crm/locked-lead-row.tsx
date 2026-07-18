"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function LockedLeadRow({ colSpan = 7 }: { colSpan?: number }) {
  return (
    <TableRow className="bg-muted/40">
      <TableCell colSpan={colSpan} className="py-4">
        <div className="flex flex-col items-center justify-between gap-3 blur-[0.5px] sm:flex-row sm:blur-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            <span className="select-none blur-sm">
              Lead bloqueado · datos ocultos en plan Free
            </span>
          </div>
          <Button asChild size="sm">
            <Link href="/app/plan">Actualiza a Pro para ver todos tus leads</Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
