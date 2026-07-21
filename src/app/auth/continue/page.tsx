import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/app/dashboard";
  }
  return raw;
}

/**
 * Post-login/signup: envía al CRM o a registrar negocio si aún no hay businessId.
 * Si el cliente Clerk está firmado pero el servidor no ve sesión, vuelve a login
 * con authError para cortar el loop infinito.
 */
export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? null);

  if (!session?.user) {
    const login = new URL("/login", "http://local");
    login.searchParams.set("callbackUrl", callbackUrl);
    login.searchParams.set("authError", "no_server_session");
    redirect(`${login.pathname}${login.search}`);
  }

  if (!session.user.businessId) {
    redirect("/registrar-empresa");
  }

  redirect(callbackUrl);
}
