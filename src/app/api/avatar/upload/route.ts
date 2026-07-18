import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPublicBlobStoreId,
  getPublicBlobToken,
  isPublicBlobConfigured,
} from "@/lib/blob-public";

export const runtime = "nodejs";

/**
 * Upload de avatar / imagen al store Blob público.
 * Misma API que la doc de Vercel: POST ?filename=…  body = File
 *
 * Requiere sesión + BLOB_PUBLIC_READ_WRITE_TOKEN (o BLOB_PUBLIC_STORE_ID + OIDC).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isPublicBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Blob no configurado. Define BLOB_PUBLIC_READ_WRITE_TOKEN y BLOB_PUBLIC_STORE_ID en Vercel.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename?.trim()) {
    return NextResponse.json(
      { error: "Falta el query param filename." },
      { status: 400 },
    );
  }

  const contentTypeHeader = request.headers.get("content-type") ?? "";
  const contentType = contentTypeHeader.split(";")[0]?.trim() || guessType(filename);

  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes (jpeg, png, webp)." },
      { status: 400 },
    );
  }

  const body = request.body;
  if (!body) {
    return NextResponse.json({ error: "Archivo vacío." }, { status: 400 });
  }

  const token = getPublicBlobToken();
  const storeId = getPublicBlobStoreId();
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  try {
    const blob = await put(
      `avatars/${session.user.id}/${Date.now()}-${safeName || "avatar"}`,
      body,
      {
        access: "public",
        contentType,
        addRandomSuffix: true,
        ...(token ? { token } : {}),
        ...(storeId ? { storeId } : {}),
      },
    );

    return NextResponse.json(blob);
  } catch (error) {
    console.error("[api/avatar/upload]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo subir el archivo.",
      },
      { status: 500 },
    );
  }
}

function guessType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}
