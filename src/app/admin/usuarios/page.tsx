import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { UserAdminPanel } from "@/components/admin/user-admin-panel";

export const metadata: Metadata = {
  title: "Usuarios",
};

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  await requireSuperAdmin();

  const [users, businesses] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabled: true,
        createdAt: true,
        business: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 500,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de usuarios</h1>
        <p className="text-muted-foreground">
          Administra roles, tenants y acceso al CRM multi-tenant.
        </p>
      </div>
      <UserAdminPanel
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        businesses={businesses}
      />
    </div>
  );
}
