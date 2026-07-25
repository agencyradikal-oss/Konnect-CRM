import { createHash, randomBytes } from "node:crypto";

export const CLAIM_TOKEN_TTL_DAYS = 14;

export function normalizeClaimEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function claimTokenExpiry(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + CLAIM_TOKEN_TTL_DAYS);
  return d;
}

export function isClaimTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < Date.now();
}
