"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { optimizeDayRoute } from "@/actions/google-gbp";

export function DayRoutePanel({
  date,
  appointments,
}: {
  date: string;
  appointments: {
    id: string;
    title: string;
    startsAt: string;
    address: string | null;
    city: string | null;
    mapsUrl: string | null;
    routeOrder: number | null;
  }[];
}) {
  const [pending, startTransition] = useTransition();

  const sorted = [...appointments].sort((a, b) => {
    const ao = a.routeOrder ?? 999;
    const bo = b.routeOrder ?? 999;
    if (ao !== bo) return ao - bo;
    return a.startsAt.localeCompare(b.startsAt);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={pending || sorted.length < 2}
          onClick={() =>
            startTransition(async () => {
              const res = await optimizeDayRoute({ date });
              if (res.ok) {
                toast.success("Ruta optimizada.");
                if (res.mapsUrl) window.open(res.mapsUrl, "_blank");
              } else toast.error(res.error ?? "Error");
            })
          }
        >
          <Route className="size-4" />
          Optimizar y abrir Maps
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay citas programadas para este día.
        </p>
      ) : (
        <ol className="space-y-3">
          {sorted.map((a, i) => (
            <li key={a.id}>
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <Badge className="mt-0.5">{i + 1}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(a.startsAt).toLocaleTimeString("es-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {(a.address || a.city) &&
                        ` · ${[a.address, a.city].filter(Boolean).join(", ")}`}
                    </p>
                  </div>
                  {a.mapsUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={a.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
