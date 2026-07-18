"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";
import { uploadPublicImage } from "@/lib/upload-public-image";

type Folder = "logo" | "cover" | "gallery" | "uploads";

/**
 * Comprime + sube al Blob público vía `/api/blob/upload`.
 * Expone la URL resultante (no el File) para evitar límites de body en Server Actions.
 */
export function ImageUpload({
  label,
  folder,
  url,
  onUrlChange,
  existingUrl,
  aspect = "square",
}: {
  label: string;
  folder: Folder;
  url: string | null;
  onUrlChange: (url: string | null) => void;
  existingUrl?: string | null;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(next: File | null) {
    if (!next) {
      onUrlChange(null);
      return;
    }

    setBusy(true);
    try {
      const compressed = await compressImage(next, {
        maxWidth: aspect === "wide" ? 1920 : 1200,
        maxHeight: aspect === "wide" ? 1080 : 1200,
        maxBytes: 900_000,
      });
      const blob = await uploadPublicImage(compressed, folder);
      onUrlChange(blob.url);
      toast.success("Imagen subida.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen. Prueba con otra más pequeña.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shown = url ?? existingUrl ?? null;
  const isNew = Boolean(url);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {shown ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt={label}
            className={cn(
              "rounded-lg border object-cover",
              aspect === "square" ? "size-28" : "h-28 w-56",
            )}
          />
          {isNew && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 size-6 rounded-full"
              onClick={() => void handleFile(null)}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      ) : null}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {busy ? "Subiendo…" : shown ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          Máx. ~1 MB (se comprime y sube a Vercel Blob).
        </p>
      </div>
    </div>
  );
}
