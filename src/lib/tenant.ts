import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function agentLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}) {
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
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/**
 * Tenant actual del CRM.
 * Layout y page RSC corren en paralelo: sin businessId usamos redirect (no throw)
 * para no romper el dashboard mientras el layout también redirige a registrar.
 */
export async function getCurrentBusiness() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/app/dashboard");
  }
  if (!session.user.businessId) {
    agentLog({
      hypothesisId: "G",
      location: "lib/tenant.ts:no-business",
      message: "getCurrentBusiness-redirect-registrar",
      data: { role: session.user.role },
    });
    redirect("/registrar-empresa");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  if (!business) {
    agentLog({
      hypothesisId: "G",
      location: "lib/tenant.ts:business-missing",
      message: "getCurrentBusiness-redirect-orphan-businessId",
      data: {},
    });
    redirect("/registrar-empresa");
  }

  return {
    session,
    businessId: business.id,
    business,
  };
}
