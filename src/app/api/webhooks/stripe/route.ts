import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { applyPlanToBusiness, planFromSubscription } from "@/lib/billing-sync";
import type { Plan } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveBusinessId(params: {
  businessId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  if (params.businessId) {
    const byId = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }
  if (params.customerId) {
    const byCustomer = await prisma.business.findFirst({
      where: { stripeCustomerId: params.customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;
  }
  if (params.subscriptionId) {
    const bySub = await prisma.business.findFirst({
      where: { stripeSubscriptionId: params.subscriptionId },
      select: { id: true },
    });
    if (bySub) return bySub.id;
  }
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("[stripe webhook] signature failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const businessId = await resolveBusinessId({
          businessId:
            session.metadata?.businessId ?? session.client_reference_id,
          customerId:
            typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
        });
        if (!businessId) {
          console.error("[stripe webhook] business not found for checkout", session.id);
          break;
        }

        let plan = (session.metadata?.plan as Plan | undefined) ?? "PRO";
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subId);
          plan = planFromSubscription(sub);
        } else if (session.metadata?.plan === "PREMIUM") {
          plan = "PREMIUM";
        }

        await applyPlanToBusiness(prisma, businessId, plan, {
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: subId ?? undefined,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const businessId = await resolveBusinessId({
          businessId: sub.metadata?.businessId,
          customerId: typeof sub.customer === "string" ? sub.customer : null,
          subscriptionId: sub.id,
        });
        if (!businessId) {
          console.error("[stripe webhook] business not found for subscription", sub.id);
          break;
        }

        const plan =
          event.type === "customer.subscription.deleted"
            ? ("FREE" as const)
            : planFromSubscription(sub);

        await applyPlanToBusiness(prisma, businessId, plan, {
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : undefined,
          stripeSubscriptionId:
            plan === "FREE" ? null : sub.id,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook] handler error:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
