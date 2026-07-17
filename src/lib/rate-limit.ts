import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip")?.trim() || h.get("cf-connecting-ip")?.trim() || "unknown";
}

/** Máx 5 envíos de formulario por hora por IP. */
export async function assertLeadFormRateLimit(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const ip = await getClientIp();
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - WINDOW_MS);

  const count = await prisma.leadRateLimit.count({
    where: { ipHash, createdAt: { gte: since } },
  });

  if (count >= MAX_SUBMISSIONS) {
    return {
      ok: false,
      error: "Demasiados envíos. Intenta de nuevo en una hora.",
    };
  }

  await prisma.leadRateLimit.create({ data: { ipHash } });
  return { ok: true };
}
