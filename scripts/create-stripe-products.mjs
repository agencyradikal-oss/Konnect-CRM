/**
 * Crea productos/precios Pro y Premium en Stripe.
 * Uso: STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-products.mjs
 *
 * Imprime los price IDs para pegar en .env / Vercel:
 *   STRIPE_PRICE_PRO=price_...
 *   STRIPE_PRICE_PREMIUM=price_...
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("Falta STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(key);

async function upsertProduct(name, description, amountCents, lookupKey) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    expand: ["data.product"],
    limit: 1,
  });
  if (existing.data[0]) {
    console.log(`✓ Ya existe ${lookupKey}: ${existing.data[0].id}`);
    return existing.data[0];
  }

  const product = await stripe.products.create({
    name,
    description,
    metadata: { konnect_plan: lookupKey },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: lookupKey,
    metadata: { konnect_plan: lookupKey },
  });

  console.log(`✓ Creado ${lookupKey}: ${price.id}`);
  return price;
}

const pro = await upsertProduct(
  "Konnect Pro",
  "CRM ilimitado, galería 10 fotos, badge Verificado, 3 usuarios",
  1900,
  "konnect_pro_monthly",
);

const premium = await upsertProduct(
  "Konnect Premium",
  "Todo Pro + Destacado + Analytics + 10 usuarios",
  4900,
  "konnect_premium_monthly",
);

console.log("\n# Agrega a .env / Vercel:\n");
console.log(`STRIPE_PRICE_PRO="${pro.id}"`);
console.log(`STRIPE_PRICE_PREMIUM="${premium.id}"`);
console.log(`\n# Webhook endpoint: https://TU_DOMINIO/api/webhooks/stripe`);
console.log(
  "# Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted",
);
