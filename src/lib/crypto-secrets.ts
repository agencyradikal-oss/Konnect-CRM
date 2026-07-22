import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function keyFromEnv(): Buffer {
  const raw =
    process.env.TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.CLERK_SECRET_KEY?.trim() ||
    "konnect-dev-only-insecure-key";
  return createHash("sha256").update(raw).digest();
}

/** Cifra un secreto (p. ej. refresh token OAuth) para reposo en DB. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, keyFromEnv(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [ver, ivB64, tagB64, dataB64] = payload.split(":");
  if (ver !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Token cifrado inválido.");
  }
  const decipher = createDecipheriv(
    ALGO,
    keyFromEnv(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
