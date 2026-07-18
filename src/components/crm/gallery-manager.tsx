"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addGalleryImage, removeGalleryImage } from "@/actions/business";
import { compressImage } from "@/lib/compress-image";

export function GalleryManager({
  gallery,
  maxPhotos,
}: {
  gallery: string[];
  maxPhotos: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const atLimit = gallery.length >= maxPhotos;

  function onPick(file: File | null) {
    if (!file) return;
    if (atLimit) {
      toast.error(`Límite de ${maxPhotos} fotos en tu plan.`);
      return;
    }

    startTransition(async () => {
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          maxBytes: 900_000,
        });
        const fd = new FormData();
        fd.set("image", compressed);
        const res = await addGalleryImage(fd);
        if (res.ok) toast.success("Foto agregada a la galería.");
        else toast.error(res.error);
      } catch {
        toast.error("No se pudo subir la imagen.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Galería</h3>
          <p className="text-sm text-muted-foreground">
            {gallery.length}/{maxPhotos} fotos en tu plan
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || atLimit}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {pending ? "Subiendo…" : "Agregar"}
        </Button>
      </div>

      {atLimit && (
        <p className="text-xs text-muted-foreground">
          Límite alcanzado.{" "}
          <Link href="/app/plan" className="text-primary underline">
            Actualiza tu plan
          </Link>{" "}
          para más fotos.
        </p>
      )}

      {gallery.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin fotos en la galería.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((url) => (
            <li key={url} className="group relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-1 top-1 size-7 opacity-90"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await removeGalleryImage({ url });
                    if (res.ok) toast.success("Foto eliminada.");
                    else toast.error("No se pudo eliminar.");
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
