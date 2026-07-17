/**
 * En CI/Vercel: aplica migraciones. Si Neon ya tiene el schema (db push)
 * pero sin historial, hace baseline de la migración init.
 */
import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  return result.status ?? 1;
}

const migrate = run("npx", ["prisma", "migrate", "deploy"]);
if (migrate === 0) {
  process.exit(0);
}

console.log("[db-prepare] migrate deploy falló — intentando baseline init…");
const resolve = run("npx", [
  "prisma",
  "migrate",
  "resolve",
  "--applied",
  "20260717150000_init",
]);
if (resolve !== 0) {
  process.exit(resolve);
}

process.exit(run("npx", ["prisma", "migrate", "deploy"]));
