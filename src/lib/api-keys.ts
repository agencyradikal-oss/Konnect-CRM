import { createHash, randomBytes, timingSafeEqual } from "crypto";

const KEY_PREFIX = "kn_live_";

export function generateApiKeyPlaintext(): {
  plaintext: string;
  prefix: string;
  hash: string;
} {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `${KEY_PREFIX}${secret}`;
  const prefix = plaintext.slice(0, 12);
  return { plaintext, prefix, hash: hashApiKey(plaintext) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function verifyApiKeyHash(plaintext: string, hash: string): boolean {
  const a = Buffer.from(hashApiKey(plaintext), "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return m?.[1]?.trim() || null;
}

export function isApiKeyFormat(token: string): boolean {
  return token.startsWith(KEY_PREFIX) && token.length > KEY_PREFIX.length + 8;
}
