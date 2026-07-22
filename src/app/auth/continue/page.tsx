import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthContinueClient } from "@/components/auth/auth-continue-client";

export const dynamic = "force-dynamic";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/app/dashboard";
  }
  return raw;
}

/**
 * Post-login/signup. Si el servidor ya ve sesión → redirect inmediato.
 * Si no (handshake OAuth/proxy pendiente) → cliente espera y reintenta.
 */
export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? null);

  const session = await auth();
  if (session?.user) {
    if (!session.user.businessId) {
      redirect("/registrar-empresa");
    }
    redirect(callbackUrl);
  }

  return <AuthContinueClient callbackUrl={callbackUrl} />;
}
