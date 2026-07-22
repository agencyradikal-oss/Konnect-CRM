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
    /** Otorga/renueva cortesía lifetime (Premium). */
    forceCourtesy?: boolean;
    /** Quita el flag de cortesía (revocación). */
    clearCourtesy?: boolean;
  },
) {
  const current = await db.business.findUnique({
    where: { id: businessId },
    select: { planCourtesy: true, plan: true },
  });

  // Socios con cortesía: Stripe no puede degradar el plan.
  if (
    current?.planCourtesy &&
    !extras?.forceCourtesy &&
    !extras?.clearCourtesy
  ) {
    const rank = { FREE: 0, PRO: 1, PREMIUM: 2 } as const;
    if (rank[plan] < rank.PREMIUM) {
      await db.business.update({
        where: { id: businessId },
        data: {
          ...(extras?.stripeCustomerId !== undefined && {
            stripeCustomerId: extras.stripeCustomerId,
          }),
          ...(extras?.stripeSubscriptionId !== undefined && {
            stripeSubscriptionId: extras.stripeSubscriptionId,
          }),
        },
      });
      return { skipped: true as const, reason: "plan_courtesy" as const };
    }
  }

  const effectivePlan: Plan = extras?.forceCourtesy ? "PREMIUM" : plan;
  const limits = getPlanLimits(effectivePlan);

  await db.business.update({
    where: { id: businessId },
    data: {
      plan: effectivePlan,
      featured: limits.featured,
      ...(extras?.forceCourtesy && { planCourtesy: true }),
      ...(extras?.clearCourtesy && { planCourtesy: false }),
      ...(extras?.stripeCustomerId !== undefined && {
        stripeCustomerId: extras.stripeCustomerId,
      }),
      ...(extras?.stripeSubscriptionId !== undefined && {
        stripeSubscriptionId: extras.stripeSubscriptionId,
      }),
    },
  });

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

  return { skipped: false as const };
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
