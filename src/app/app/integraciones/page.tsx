import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { IntegrationsPanel } from "@/components/crm/integrations-panel";
import { GoogleIntegrationsCard } from "@/components/crm/google-integrations-card";
import { ApiKeysCard } from "@/components/crm/api-keys-card";
import { getGoogleConnectionStatus } from "@/actions/google-connect";

export const metadata: Metadata = {
  title: "Integraciones",
};

export const dynamic = "force-dynamic";

export default async function IntegracionesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const session = await auth();
  const { business, businessId } = await getCurrentBusiness();
  const params = await searchParams;
  const [googleStatus, apiKeys] = await Promise.all([
    getGoogleConnectionStatus(),
    prisma.businessApiKey.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const isOwner =
    session?.user?.role === "BUSINESS_OWNER" ||
    session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground">
          Stripe, Google, API keys de partners, webhooks Zapier/Make. Square /
          QuickBooks: vía webhook (OAuth nativo en roadmap).
        </p>
      </div>

      <GoogleIntegrationsCard
        status={googleStatus}
        googleQuery={params.google}
      />

      <ApiKeysCard
        isOwner={Boolean(isOwner)}
        keys={apiKeys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          revokedAt: k.revokedAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
        }))}
      />

      <IntegrationsPanel
        initial={{
          plan: business.plan,
          stripeCustomerId: business.stripeCustomerId,
          stripeSubscriptionId: business.stripeSubscriptionId,
          webhookUrl: business.webhookUrl,
          webhookSecret: business.webhookSecret,
          webhookEnabled: business.webhookEnabled,
          isOwner: Boolean(isOwner),
        }}
      />
    </div>
  );
}
