import { put, type PutBlobResult } from "@vercel/blob";

/**
 * Store público de Vercel Blob (logos, portadas, galería del directorio).
 *
 * Env (prefijo BLOB_PUBLIC_*):
 * - BLOB_PUBLIC_READ_WRITE_TOKEN — token rw del store público
 * - BLOB_PUBLIC_STORE_ID — id del store (OIDC / multi-store)
 * - BLOB_PUBLIC_WEBHOOK_PUBLIC_KEY — verificar webhooks de upload (client uploads)
 *
 * Fallback legacy: BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID
 */
export function getPublicBlobToken(): string | null {
  return (
    process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    null
  );
}

export function getPublicBlobStoreId(): string | null {
  return (
    process.env.BLOB_PUBLIC_STORE_ID?.trim() ||
    process.env.BLOB_STORE_ID?.trim() ||
    null
  );
}

export function getPublicBlobWebhookKey(): string | null {
  return process.env.BLOB_PUBLIC_WEBHOOK_PUBLIC_KEY?.trim() || null;
}

export function isPublicBlobConfigured(): boolean {
  return Boolean(getPublicBlobToken() || getPublicBlobStoreId());
}

/** Sube un blob al store público (URLs públicas para el directorio). */
export async function putPublicBlob(
  pathname: string,
  body: Parameters<typeof put>[1],
  options?: { contentType?: string; addRandomSuffix?: boolean },
): Promise<PutBlobResult> {
  const token = getPublicBlobToken();
  const storeId = getPublicBlobStoreId();

  if (!token && !storeId) {
    throw new Error(
      "Blob público no configurado. Define BLOB_PUBLIC_READ_WRITE_TOKEN (y opcionalmente BLOB_PUBLIC_STORE_ID).",
    );
  }

  return put(pathname, body, {
    access: "public",
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
    ...(options?.contentType ? { contentType: options.contentType } : {}),
    addRandomSuffix: options?.addRandomSuffix ?? true,
  });
}
