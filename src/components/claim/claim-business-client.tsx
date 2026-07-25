"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Building2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { claimBusinessWithToken } from "@/actions/claim-business";

type Props = {
  token: string;
  businessName: string;
  claimEmailMasked: string;
  isSignedIn: boolean;
  sessionEmail: string | null;
};

export function ClaimBusinessClient({
  token,
  businessName,
  claimEmailMasked,
  isSignedIn,
  sessionEmail,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const callbackUrl = `/reclamar/${token}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const signupHref = `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  function onClaim() {
    startTransition(async () => {
      const res = await claimBusinessWithToken({ token });
      if (res.ok) {
        toast.success(`«${res.name}» ya es tuyo. Bienvenido al CRM.`);
        router.replace("/app/dashboard");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Reclamar negocio
          </CardTitle>
          <CardDescription>
            Confirma que eres el dueño de <strong>{businessName}</strong> e
            ingresa al CRM de Konnect.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Debes usar el correo de la invitación ({claimEmailMasked}).
          </p>

          {!isSignedIn ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href={loginHref}>
                  <LogIn className="size-4" />
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={signupHref}>
                  <UserPlus className="size-4" />
                  Crear cuenta
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                Sesión:{" "}
                <span className="font-medium">{sessionEmail ?? "—"}</span>
              </p>
              <Button
                type="button"
                className="w-full"
                disabled={pending}
                onClick={onClaim}
              >
                {pending ? "Reclamando…" : `Reclamar ${businessName}`}
              </Button>
              <p className="text-xs text-muted-foreground">
                Si este no es el correo correcto, cierra sesión e inicia con el
                de la invitación.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
