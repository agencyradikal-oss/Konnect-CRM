import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Tenant actual del CRM. Lanza si no hay sesión con businessId
 * o si el negocio no existe.
 */
export async function getCurrentBusiness() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("No autorizado: se requiere sesión con negocio.");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  if (!business) {
    throw new Error("Negocio no encontrado para esta sesión.");
  }

  return {
    session,
    businessId: business.id,
    business,
  };
}
