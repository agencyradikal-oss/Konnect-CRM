import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isPublicBlobConfigured, putPublicBlob } from "@/lib/blob-public";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const folderSchema = z.enum(["logo", "cover", "gallery", "uploads"]);

/**
 * Server upload al store Blob público (patrón Vercel docs).
 * Cliente: POST /api/blob/upload?filename=x.png&folder=logo  body = File
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isPublicBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Blob no configurado. Define BLOB_PUBLIC_READ_WRITE_TOKEN y BLOB_PUBLIC_STORE_ID.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename")?.trim();
  const folderRaw = searchParams.get("folder")?.trim() ?? "uploads";

  if (!filename) {
    return NextResponse.json(
      { error: "Falta filename en la query." },
      { status: 400 },
    );
  }

  const folderParsed = folderSchema.safeParse(folderRaw);
  if (!folderParsed.success) {
    return NextResponse.json({ error: "folder inválido." }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!ALLOWED_TYPES.has(contentType.split(";")[0]!.trim())) {
    return NextResponse.json(
      { error: "Solo imágenes JPEG, PNG, WebP o GIF." },
      { status: 400 },
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return NextResponse.json({ error: "Archivo vacío." }, { status: 400 });
  }
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera 4MB." },
      { status: 400 },
    );
  }

  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const userId = session.user.id;
  const pathname = `businesses/${userId}/${folderParsed.data}/${Date.now()}-${safeName || "image"}`;

  try {
    const blob = await putPublicBlob(pathname, body, {
      contentType: contentType.split(";")[0]!.trim(),
      addRandomSuffix: true,
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("[api/blob/upload]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo subir el archivo.",
      },
      { status: 500 },
    );
  }
}
