/**
 * Neon a veces inyecta DATABASE_URL (pooler) con DATABASE_URL_UNPOOLED vacío.
 * Prisma exige directUrl no vacío; si falta, reutilizamos la pooled.
 * Solo mutamos process.env (no escribimos .env en Vercel).
 */
const pooled = process.env.DATABASE_URL?.trim() || "";
const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim() || "";

if (!pooled) {
  console.error("[ensure-unpooled] DATABASE_URL is missing");
  process.exit(1);
}

if (!unpooled) {
  process.env.DATABASE_URL_UNPOOLED = pooled;
  console.log("[ensure-unpooled] DATABASE_URL_UNPOOLED ← DATABASE_URL (fallback)");
} else {
  console.log("[ensure-unpooled] DATABASE_URL_UNPOOLED ok");
}
