/**
 * Comprime/redimensiona una imagen en el browser antes de enviarla
 * por Server Action (límite típico ~1MB por defecto).
 */
export async function compressImage(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number; maxBytes?: number } = {},
): Promise<File> {
  const maxWidth = opts.maxWidth ?? 1600;
  const maxHeight = opts.maxHeight ?? 1600;
  const quality = opts.quality ?? 0.82;
  const maxBytes = opts.maxBytes ?? 900_000;

  if (!file.type.startsWith("image/") || file.size <= maxBytes) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let q = quality;
  let blob: Blob | null = null;
  for (let i = 0; i < 5; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", q),
    );
    if (!blob || blob.size <= maxBytes) break;
    q -= 0.12;
  }

  if (!blob) return file;

  const name = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
