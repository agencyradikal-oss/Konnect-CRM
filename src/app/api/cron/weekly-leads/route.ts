import { NextResponse } from "next/server";
import type { LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWeeklyLeadsEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_LABELS: Partial<Record<LeadSource, string>> = {
  DIRECTORY_FORM: "Formulario",
  QUOTE_REQUEST: "Cotización",
  CLICK_CALL: "Llamadas",
  CLICK_WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
  IMPORT: "Import",
  REFERRAL: "Referido",
};

/**
 * Cron Vercel: lunes 8:00 America/New_York = 12:00 UTC (sin DST) / 13:00 UTC (DST).
 * vercel.json: "0 12 * * 1"
 * Protegido con CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const businesses = await prisma.business.findMany({
    where: {
      status: "ACTIVE",
      leads: { some: { createdAt: { gte: since } } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      users: {
        where: { role: { in: ["BUSINESS_OWNER", "BUSINESS_STAFF"] } },
        select: { email: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
      leads: {
        where: { createdAt: { gte: since } },
        select: { source: true },
      },
    },
  });

  let sent = 0;
  for (const biz of businesses) {
    const to = biz.email?.trim() || biz.users[0]?.email;
    if (!to || biz.leads.length === 0) continue;

    const counts = new Map<LeadSource, number>();
    for (const lead of biz.leads) {
      counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
    }
    const bySource = [...counts.entries()].map(([source, count]) => ({
      label: SOURCE_LABELS[source] ?? source,
      count,
    }));

    await sendWeeklyLeadsEmail({
      to,
      businessName: biz.name,
      totalLeads: biz.leads.length,
      bySource,
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, businesses: businesses.length, sent });
}
