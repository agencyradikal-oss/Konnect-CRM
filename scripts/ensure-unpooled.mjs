/**
 * Neon a veces inyecta DATABASE_URL (pooler) sin DATABASE_URL_UNPOOLED.
 * Prisma migrate necesita directUrl; si falta, reutilizamos la pooled.
 */
import fs from "node:fs";

const pooled = process.env.DATABASE_URL?.trim() || "";
const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim() || "";

if (!pooled) {
  console.error("[ensure-unpooled] DATABASE_URL is missing");
  process.exit(1);
}

if (!unpooled) {
  process.env.DATABASE_URL_UNPOOLED = pooled;
  fs.appendFileSync(".env", `\nDATABASE_URL_UNPOOLED="${pooled}"\n`);
  console.log("[ensure-unpooled] DATABASE_URL_UNPOOLED ← DATABASE_URL (fallback)");
} else {
  console.log("[ensure-unpooled] DATABASE_URL_UNPOOLED ok");
}
