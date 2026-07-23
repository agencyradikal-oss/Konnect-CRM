import { prisma } from "@/lib/prisma";
import {
  extractBearerToken,
  hashApiKey,
  isApiKeyFormat,
} from "@/lib/api-keys";

export type ApiKeyAuth = {
  businessId: string;
  apiKeyId: string;
};

/** Resuelve Bearer kn_live_… → businessId. */
export async function authenticateApiKey(
  req: Request,
): Promise<
  | { ok: true; auth: ApiKeyAuth }
  | { ok: false; status: number; error: string }
> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token || !isApiKeyFormat(token)) {
    return {
      ok: false,
      status: 401,
      error: "Missing or invalid Authorization Bearer kn_live_… key.",
    };
  }

  const keyHash = hashApiKey(token);
  const row = await prisma.businessApiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { id: true, businessId: true },
  });

  if (!row) {
    return { ok: false, status: 401, error: "Invalid API key." };
  }

  void prisma.businessApiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return {
    ok: true,
    auth: { businessId: row.businessId, apiKeyId: row.id },
  };
}
