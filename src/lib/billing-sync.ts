import type { Plan, PrismaClient } from "@prisma/client";
import { getPlanLimits, planFromStripePriceId } from "@/lib/plans";

type Db = PrismaClient;

export async function applyPlanToBusiness(
  db: Db,
  businessId: string,
  plan: Plan,
  extras?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
) {
  const limits = getPlanLimits(plan);

  await db.business.update({
    where: { id: businessId },
    data: {
      plan,
      featured: limits.featured,
      ...(extras?.stripeCustomerId !== undefined && {
        stripeCustomerId: extras.stripeCustomerId,
      }),
      ...(extras?.stripeSubscriptionId !== undefined && {
        stripeSubscriptionId: extras.stripeSubscriptionId,
      }),
      // Si baja de Premium, quitar Destacado (featured ya false).
      // Si baja de Pro, quitar verified eligibility — no auto-unverify
      // (la revisión admin puede haberlo verificado; se mantiene).
    },
  });

  // Recortar galería si excede el nuevo límite
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { gallery: true },
  });
  if (biz && biz.gallery.length > limits.galleryPhotos) {
    await db.business.update({
      where: { id: businessId },
      data: { gallery: biz.gallery.slice(0, limits.galleryPhotos) },
    });
  }
}

export function planFromSubscription(subscription: {
  status: string;
  items: { data: { price: { id: string } }[] };
}): Plan {
  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    return "FREE";
  }
  const priceId = subscription.items.data[0]?.price?.id;
  return planFromStripePriceId(priceId);
}
