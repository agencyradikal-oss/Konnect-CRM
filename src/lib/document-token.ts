import { createHash, randomBytes } from "node:crypto";

/** Token público de presupuesto (/p/[token]) — TTL largo (90 días). */
export const DOCUMENT_TOKEN_TTL_DAYS = 90;

export function generateDocumentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDocumentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function documentTokenExpiry(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + DOCUMENT_TOKEN_TTL_DAYS);
  return d;
}

export function isDocumentTokenExpired(
  expiresAt: Date | null | undefined,
): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}
