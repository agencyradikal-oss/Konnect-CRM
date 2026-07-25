import { Role } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ClaimAdminPanel,
  type ClaimRow,
} from "@/components/admin/claim-admin-panel";
import { isClaimTokenExpired } from "@/lib/business-claim";

export default async function AdminReclamosPage() {
  await requireSuperAdmin();

  const businesses = await prisma.business.findMany({
    where: {
      claimedAt: null,
      users: { none: { role: Role.BUSINESS_OWNER } },
      status: { in: ["ACTIVE", "PENDING"] },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      claimEmail: true,
      claimTokenHash: true,
      claimTokenExpiresAt: true,
    },
  });

  const rows: ClaimRow[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    status: b.status,
    claimEmail: b.claimEmail,
    tokenExpiresAt: b.claimTokenExpiresAt?.toISOString() ?? null,
    hasToken: Boolean(b.claimTokenHash),
    tokenExpired: isClaimTokenExpired(b.claimTokenExpiresAt),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reclamos</h1>
        <p className="text-muted-foreground">
          Fichas KMD u otras sin dueño: asigna email, envía invitación y el
          cliente reclama al entrar con Clerk.
        </p>
      </div>
      <ClaimAdminPanel rows={rows} />
    </div>
  );
}
