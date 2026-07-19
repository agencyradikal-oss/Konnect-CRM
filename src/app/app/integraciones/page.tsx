import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/tenant";
import { IntegrationsPanel } from "@/components/crm/integrations-panel";

export const metadata: Metadata = {
  title: "Integraciones",
};

export const dynamic = "force-dynamic";

export default async function IntegracionesPage() {
  const session = await auth();
  const { business } = await getCurrentBusiness();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground">
          Stripe (plan Konnect), webhooks hacia Zapier/Make, y roadmap Square /
          QuickBooks.
        </p>
      </div>
      <IntegrationsPanel
        initial={{
          plan: business.plan,
          stripeCustomerId: business.stripeCustomerId,
          stripeSubscriptionId: business.stripeSubscriptionId,
          webhookUrl: business.webhookUrl,
          webhookSecret: business.webhookSecret,
          webhookEnabled: business.webhookEnabled,
          isOwner: session?.user?.role === "BUSINESS_OWNER",
        }}
      />
    </div>
  );
}
