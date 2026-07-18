import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  href,
  icon: Icon,
  changePct,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  changePct: number | null;
}) {
  const up = changePct !== null && changePct >= 0;
  const down = changePct !== null && changePct < 0;

  return (
    <Link href={href}>
      <Card className="h-full border-border/80 shadow-sm transition-colors hover:border-primary">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            {changePct === null ? (
              <span className="text-xs text-muted-foreground">vs mes ant.</span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  up && "bg-emerald-100 text-emerald-700",
                  down && "bg-red-100 text-red-700",
                  changePct === 0 && "bg-muted text-muted-foreground",
                )}
              >
                {up ? (
                  <TrendingUp className="size-3" />
                ) : down ? (
                  <TrendingDown className="size-3" />
                ) : null}
                {changePct > 0 ? "+" : ""}
                {changePct.toFixed(0)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
