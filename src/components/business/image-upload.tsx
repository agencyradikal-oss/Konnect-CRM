"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";

export function ImageUpload({
  label,
  file,
  onChange,
  existingUrl,
  aspect = "square",
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (!next) {
      setPreview(null);
      onChange(null);
      return;
    }

    setBusy(true);
    try {
      const compressed = await compressImage(next, {
        maxWidth: aspect === "wide" ? 1920 : 1200,
        maxHeight: aspect === "wide" ? 1080 : 1200,
        maxBytes: 900_000,
      });
      setPreview(URL.createObjectURL(compressed));
      onChange(compressed);
    } catch {
      toast.error("No se pudo procesar la imagen. Prueba con otra más pequeña.");
      setPreview(null);
      onChange(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shown = preview ?? existingUrl ?? null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
          {file && (
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
          {busy ? "Procesando…" : shown ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        {file && (
          <span className="ml-2 text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Máx. ~1 MB por imagen (se comprime automáticamente).
        </p>
      </div>
    </div>
  );
}
