import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    features: [
      "Perfil en el directorio",
      "Hasta 20 leads al mes",
      "CRM básico (leads y contactos)",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$29/mes",
    features: [
      "Todo lo de Free",
      "Leads ilimitados",
      "Pipeline de deals y tareas",
      "Badge de verificado",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "$79/mes",
    features: [
      "Todo lo de Pro",
      "Posición destacada en el directorio",
      "Galería de fotos ampliada",
      "Soporte prioritario",
    ],
  },
];

export default async function PlanPage() {
  const { businessId } = await getCurrentBusiness();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plan y facturación</h1>
        <p className="text-muted-foreground">
          Tu plan actual: <Badge className="ml-1">{business.plan}</Badge>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === business.plan;
          return (
            <Card
              key={plan.id}
              className={cn(isCurrent && "border-primary ring-1 ring-primary")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge>Actual</Badge>}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {plan.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button disabled={isCurrent} variant={isCurrent ? "outline" : "default"}>
                  {isCurrent ? "Plan actual" : "Cambiar a este plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        El checkout con Stripe se habilitará al configurar STRIPE_SECRET_KEY.
      </p>
    </div>
  );
}
