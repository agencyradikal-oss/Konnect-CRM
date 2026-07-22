import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CourtesyAdminPanel,
  type CourtesyRow,
} from "@/components/admin/courtesy-admin-panel";

export default async function AdminSociosPage() {
  await requireSuperAdmin();

  const entitlements = await prisma.planCourtesyEntitlement.findMany({
    orderBy: [{ revokedAt: "asc" }, { grantedAt: "desc" }],
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  const rows: CourtesyRow[] = entitlements.map((e) => ({
    id: e.id,
    email: e.email,
    plan: e.plan,
    note: e.note,
    businessId: e.businessId,
    businessName: e.business?.name ?? null,
    grantedAt: e.grantedAt.toISOString(),
    revokedAt: e.revokedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Socios — cortesía</h1>
        <p className="text-muted-foreground">
          Premium lifetime sin Stripe. Agrega emails de socios; se aplica al
          vincular o registrar su negocio.
        </p>
      </div>
      <CourtesyAdminPanel rows={rows} />
    </div>
  );
}
