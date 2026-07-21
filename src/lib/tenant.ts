import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    redirect("/registrar-empresa");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  if (!business) {
    redirect("/registrar-empresa");
  }

  return {
    session,
    businessId: business.id,
    business,
  };
}
