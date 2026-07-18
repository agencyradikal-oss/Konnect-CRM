import type { PutBlobResult } from "@vercel/blob";

/**
 * Sube una imagen al store público vía `/api/blob/upload`
 * (mismo patrón que la doc de Vercel AvatarUpload).
 */
export async function uploadPublicImage(
  file: File,
  folder: "logo" | "cover" | "gallery" | "uploads" | "avatar" = "uploads",
): Promise<PutBlobResult> {
  const endpoint =
    folder === "avatar"
      ? `/api/avatar/upload?filename=${encodeURIComponent(file.name)}`
      : `/api/blob/upload?filename=${encodeURIComponent(file.name)}&folder=${folder}`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: file,
    headers: {
      "content-type": file.type || "application/octet-stream",
    },
  });

  const data = (await response.json()) as PutBlobResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "No se pudo subir la imagen.");
  }
  return data;
}
