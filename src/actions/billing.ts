"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getAppBaseUrl } from "@/lib/app-url";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getStripePriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const upgradeSchema = z.object({
  plan: z.enum(["PRO", "PREMIUM"]),
});

/** Inicia Stripe Checkout (subscription) y redirige. */
export async function startCheckout(input: unknown) {
  if (!isStripeConfigured()) {
    return {
      ok: false as const,
      error: "Stripe no está configurado. Agrega STRIPE_SECRET_KEY.",
    };
  }

  const { plan } = upgradeSchema.parse(input);
  const priceId = getStripePriceId(plan);
  if (!priceId) {
    return {
      ok: false as const,
      error: `Falta STRIPE_PRICE_${plan} en las variables de entorno.`,
    };
  }

  const { businessId, business, session } = await getCurrentBusiness();
  if (business.planCourtesy) {
    return {
      ok: false as const,
      error: "Tu negocio tiene Premium de cortesía (socio). No necesitas pagar.",
    };
  }
  const stripe = getStripe();
  const base = getAppBaseUrl();

  let customerId = business.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? business.email ?? undefined,
      name: business.name,
      metadata: { businessId },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: businessId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/app/plan?success=1`,
    cancel_url: `${base}/app/plan?canceled=1`,
    client_reference_id: businessId,
    metadata: { businessId, plan },
    subscription_data: {
      metadata: { businessId, plan },
    },
    allow_promotion_codes: true,
  });

  if (!checkout.url) {
    return { ok: false as const, error: "No se pudo crear la sesión de Checkout." };
  }

  redirect(checkout.url);
}

/** Abre el Customer Portal de Stripe. */
export async function openBillingPortal() {
  if (!isStripeConfigured()) {
    return {
      ok: false as const,
      error: "Stripe no está configurado.",
    };
  }

  const { business } = await getCurrentBusiness();
  if (business.planCourtesy) {
    return {
      ok: false as const,
      error: "Tu plan es de cortesía lifetime; no hay portal de facturación.",
    };
  }
  if (!business.stripeCustomerId) {
    return {
      ok: false as const,
      error: "Aún no tienes un cliente de facturación. Actualiza a Pro o Premium primero.",
    };
  }

  const stripe = getStripe();
  const base = getAppBaseUrl();
  const portal = await stripe.billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${base}/app/plan`,
  });

  redirect(portal.url);
}
