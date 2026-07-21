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
 */
export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? null);

  // #region agent log
  fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "11ae6f",
    },
    body: JSON.stringify({
      sessionId: "11ae6f",
      runId: "post-fix",
      hypothesisId: "D",
      location: "auth/continue/page.tsx",
      message: "auth-continue-gate",
      data: {
        hasSession: Boolean(session?.user),
        hasBusinessId: Boolean(session?.user?.businessId),
        callbackUrl,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!session.user.businessId) {
    redirect("/registrar-empresa");
  }

  redirect(callbackUrl);
}
