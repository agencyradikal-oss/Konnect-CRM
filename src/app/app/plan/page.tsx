import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { PLAN_CATALOG } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import {
  ManageBillingButton,
  UpgradeButton,
} from "@/components/crm/plan-actions";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const { businessId } = await getCurrentBusiness();
  const params = await searchParams;
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      plan: true,
      planCourtesy: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  const stripeReady = isStripeConfigured();
  const courtesy = business.planCourtesy;
  const rank = { FREE: 0, PRO: 1, PREMIUM: 2 } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan y facturación</h1>
          <p className="text-muted-foreground">
            Tu plan actual:{" "}
            <Badge className="ml-1">{business.plan}</Badge>
            {courtesy && (
              <Badge variant="secondary" className="ml-2">
                Cortesía lifetime
              </Badge>
            )}
          </p>
        </div>
        {!courtesy && business.stripeCustomerId && <ManageBillingButton />}
      </div>

      {courtesy && (
        <div className="rounded-lg border border-primary/30 bg-accent/40 px-4 py-3 text-sm">
          Eres socio de Konnect™ con <strong>Premium de cortesía</strong>{" "}
          (lifetime). No necesitas suscripción de pago; Stripe no aplica a tu
          cuenta.
        </div>
      )}

      {params.success === "1" && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ¡Pago recibido! Tu plan se actualizará en unos segundos (webhook de
          Stripe). Recarga si aún ves el plan anterior.
        </div>
      )}
      {params.canceled === "1" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout cancelado. Puedes intentar de nuevo cuando quieras.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_CATALOG.map((plan) => {
          const isCurrent = plan.id === business.plan;
          const isUpgrade = rank[plan.id] > rank[business.plan];
          const isDowngrade = rank[plan.id] < rank[business.plan];

          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col shadow-sm",
                isCurrent && "border-primary ring-1 ring-primary",
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge>Actual</Badge>}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {courtesy && plan.id === "PREMIUM"
                    ? "Cortesía"
                    : plan.priceLabel}
                </CardDescription>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {courtesy ? (
                  isCurrent ? (
                    <Badge variant="outline" className="justify-center py-2">
                      Incluido (socio)
                    </Badge>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Tu plan de socio es Premium lifetime.
                    </p>
                  )
                ) : plan.id === "FREE" ? (
                  isCurrent ? (
                    <Badge variant="outline" className="justify-center py-2">
                      Plan actual
                    </Badge>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Cancela tu suscripción en el portal para volver a Free.
                    </p>
                  )
                ) : (
                  <UpgradeButton
                    plan={plan.id}
                    disabled={
                      !stripeReady ||
                      isCurrent ||
                      (isDowngrade && Boolean(business.stripeCustomerId))
                    }
                    label={
                      !stripeReady
                        ? "Stripe no configurado"
                        : isCurrent
                          ? "Plan actual"
                          : isUpgrade
                            ? `Actualizar a ${plan.name}`
                            : "Usar portal para cambiar"
                    }
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!stripeReady && !courtesy && (
        <p className="text-sm text-muted-foreground">
          Configura <code>STRIPE_SECRET_KEY</code>,{" "}
          <code>STRIPE_PRICE_PRO</code>, <code>STRIPE_PRICE_PREMIUM</code> y{" "}
          <code>STRIPE_WEBHOOK_SECRET</code>. Ejecuta{" "}
          <code>node scripts/create-stripe-products.mjs</code> para crear los
          precios.
        </p>
      )}
    </div>
  );
}
