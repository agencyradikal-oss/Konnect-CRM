import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

function safeCallbackUrl(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/registrar-empresa";
  }
  return raw;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const continueUrl = `/auth/continue?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const isClaim = callbackUrl.startsWith("/reclamar/");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            {isClaim
              ? "Registra tu cuenta con el correo de la invitación para reclamar tu negocio."
              : "Registra tu cuenta (email o Google) y luego publica tu negocio en el directorio."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <SignUp
            routing="hash"
            forceRedirectUrl={continueUrl}
            fallbackRedirectUrl={continueUrl}
            signInUrl={loginHref}
          />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href={loginHref} className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
