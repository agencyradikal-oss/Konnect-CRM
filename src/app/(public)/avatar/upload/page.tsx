"use client";

import type { PutBlobResult } from "@vercel/blob";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Página de prueba del patrón Vercel Blob (server upload).
 * Ruta: /avatar/upload → POST /api/avatar/upload?filename=…
 */
export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Subir avatar / imagen</CardTitle>
          <CardDescription>
            Prueba del store Blob público. Debes estar autenticado. Usa JPEG, PNG
            o WebP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              if (!inputFileRef.current?.files?.length) {
                toast.error("Selecciona un archivo.");
                return;
              }

              const file = inputFileRef.current.files[0]!;
              setPending(true);
              setBlob(null);

              try {
                const response = await fetch(
                  `/api/avatar/upload?filename=${encodeURIComponent(file.name)}`,
                  {
                    method: "POST",
                    body: file,
                    headers: {
                      // El browser a veces no manda el type del File; lo fijamos.
                      "content-type": file.type || "application/octet-stream",
                    },
                  },
                );

                const data = (await response.json()) as PutBlobResult & {
                  error?: string;
                };

                if (!response.ok) {
                  throw new Error(data.error ?? "Error al subir.");
                }

                setBlob(data);
                toast.success("Imagen subida.");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No se pudo subir la imagen.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            <Input
              name="file"
              ref={inputFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Subiendo…" : "Upload"}
            </Button>
          </form>

          {blob && (
            <div className="mt-6 space-y-3 rounded-lg border bg-muted/40 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blob.url}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg object-contain"
              />
              <p className="break-all text-center text-sm">
                <a
                  href={blob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {blob.url}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
