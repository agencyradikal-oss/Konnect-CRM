import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Prisma schema usa directUrl = DATABASE_URL_UNPOOLED; Neon a veces lo deja "".
  const pooled = process.env.DATABASE_URL?.trim();
  const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim();
  if (pooled && !unpooled) {
    process.env.DATABASE_URL_UNPOOLED = pooled;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
