"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { CalendarDays, MapPinned, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  startGoogleConnect,
  disconnectGoogle,
  updateGoogleConnectionFlags,
} from "@/actions/google-connect";
import {
  listGbpLocationsForConnect,
  syncBusinessToGbp,
} from "@/actions/google-gbp";

export type GoogleStatus = {
  configured: boolean;
  planAllowsCalendar: boolean;
  planAllowsGbp: boolean;
  planAllowsRoutes: boolean;
  planAllowsBooking: boolean;
  connected: boolean;
  connection: {
    googleAccountEmail: string | null;
    calendarEnabled: boolean;
    gbpEnabled: boolean;
    gbpLocationName: string | null;
    consentAt: Date | string | null;
  } | null;
};

export function GoogleIntegrationsCard({
  status,
  googleQuery,
}: {
  status: GoogleStatus;
  googleQuery?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [consent, setConsent] = useState(false);
  const [includeGbp, setIncludeGbp] = useState(false);
  const [locations, setLocations] = useState<{ name: string; title?: string }[]>(
    [],
  );

  useEffect(() => {
    if (googleQuery === "connected") {
      toast.success("Google conectado.");
    } else if (googleQuery === "error") {
      toast.error("No se pudo conectar Google. Revisa OAuth y scopes.");
    }
  }, [googleQuery]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Google</CardTitle>
            <CardDescription>
              Calendar (citas), Maps (rutas) y Business Profile (ficha).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.connected ? "default" : "secondary"}>
            {status.connected ? "Conectado" : "No conectado"}
          </Badge>
          {!status.configured && (
            <Badge variant="outline">OAuth no configurado</Badge>
          )}
          {status.planAllowsCalendar && (
            <Badge variant="outline">Calendar Pro+</Badge>
          )}
          {status.planAllowsRoutes && (
            <Badge variant="outline">
              <MapPinned className="size-3" /> Rutas Premium
            </Badge>
          )}
          {status.planAllowsGbp && (
            <Badge variant="outline">
              <Store className="size-3" /> GBP Premium
            </Badge>
          )}
        </div>

        {status.connection?.googleAccountEmail && (
          <p className="text-sm text-muted-foreground">
            Cuenta: <strong>{status.connection.googleAccountEmail}</strong>
          </p>
        )}

        {!status.connected ? (
          <div className="space-y-3 rounded-lg border p-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Autorizo a Konnect a enviar a Google Calendar/Maps el nombre,
                teléfono y dirección de mis clientes cuando yo cree citas, según
                mi uso del CRM.
              </span>
            </label>
            {status.planAllowsGbp && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={includeGbp}
                  onChange={(e) => setIncludeGbp(e.target.checked)}
                />
                <span>
                  Incluir permisos de Google Business Profile (sync del listing
                  público, no leads).
                </span>
              </label>
            )}
            <Button
              disabled={
                pending ||
                !consent ||
                !status.configured ||
                !status.planAllowsCalendar
              }
              onClick={() =>
                startTransition(async () => {
                  await startGoogleConnect({
                    consent: true as const,
                    includeGbp,
                  });
                })
              }
            >
              Conectar Google
            </Button>
            {!status.planAllowsCalendar && (
              <p className="text-xs text-muted-foreground">
                Actualiza a Pro o Premium para conectar Calendar.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await disconnectGoogle();
                  toast.success("Google desconectado.");
                })
              }
            >
              Desconectar
            </Button>
            {status.planAllowsGbp && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await listGbpLocationsForConnect();
                      if (res.ok) {
                        setLocations(res.locations);
                        if (res.locations.length === 0) {
                          toast.message("No se encontraron ubicaciones GBP.");
                        }
                      } else toast.error(res.error ?? "Error");
                    })
                  }
                >
                  Cargar ubicaciones GBP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await syncBusinessToGbp();
                      if (res.ok) toast.success("Perfil sincronizado a GBP.");
                      else toast.error(res.error ?? "Error");
                    })
                  }
                >
                  Sync listing → GBP
                </Button>
              </>
            )}
          </div>
        )}

        {locations.length > 0 && (
          <div className="space-y-2">
            <Label>Ubicación Google Business</Label>
            <Select
              onValueChange={(value) =>
                startTransition(async () => {
                  const res = await updateGoogleConnectionFlags({
                    gbpEnabled: true,
                    gbpLocationName: value,
                  });
                  if (res.ok) toast.success("Ubicación GBP guardada.");
                  else toast.error(res.error ?? "Error");
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.name} value={l.name}>
                    {l.title ?? l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
