import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista leads del negocio autenticado con Bearer kn_live_…
 * Query: ?status=&source=&limit= (máx 100)
 */
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50),
  );

  const leads = await prisma.lead.findMany({
    where: {
      businessId: auth.auth.businessId,
      ...(status ? { status: status as never } : {}),
      ...(source ? { source: source as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      source: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: leads.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      message: l.message,
      source: l.source,
      status: l.status,
      created_at: l.createdAt.toISOString(),
    })),
  });
}
