"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  function handleFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
    onChange(next);
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
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {shown ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt={label}
            className={cn(
              "rounded-lg border object-cover",
              aspect === "square" ? "size-28" : "h-28 w-56"
            )}
          />
          {file && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 size-6 rounded-full"
              onClick={() => handleFile(null)}
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
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {shown ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        {file && (
          <span className="ml-2 text-xs text-muted-foreground">{file.name}</span>
        )}
      </div>
    </div>
  );
}
