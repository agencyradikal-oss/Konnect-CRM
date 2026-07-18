import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPublicBlobStoreId,
  isPublicBlobConfigured,
} from "@/lib/blob-public";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasUnpooledUrl = Boolean(process.env.DATABASE_URL_UNPOOLED?.trim());
  const hasPublicBlob = isPublicBlobConfigured();
  const publicBlobStoreId = getPublicBlobStoreId();
  let dbHost: string | null = null;
  let unpooledHost: string | null = null;

  const hostOf = (raw?: string) => {
    if (!raw?.trim()) return null;
    try {
      return new URL(raw.trim().replace(/^postgres(ql)?:/, "http:")).host;
    } catch {
      return "unparseable";
    }
  };

  dbHost = hostOf(process.env.DATABASE_URL);
  unpooledHost = hostOf(process.env.DATABASE_URL_UNPOOLED);

  try {
    const [categories, businesses] = await Promise.all([
      prisma.category.count(),
      prisma.business.count(),
    ]);

    return NextResponse.json({
      ok: true,
      hasDatabaseUrl,
      hasUnpooledUrl,
      hasPublicBlob,
      publicBlobStoreId,
      dbHost,
      unpooledHost,
      categories,
      businesses,
    });
  } catch (error) {
    const err = error as { code?: string; meta?: unknown; message?: string };
    return NextResponse.json(
      {
        ok: false,
        hasDatabaseUrl,
        hasUnpooledUrl,
        hasPublicBlob,
        publicBlobStoreId,
        dbHost,
        unpooledHost,
        code: err.code ?? null,
        meta: err.meta ?? null,
        message: String(err.message ?? error).slice(0, 400),
      },
      { status: 500 },
    );
  }
}
