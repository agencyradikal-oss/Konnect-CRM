import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const categories = await prisma.category.count();
  const businesses = await prisma.business.count();
  console.log("OK", { categories, businesses });
} catch (error) {
  console.log("FAIL", {
    name: error?.constructor?.name,
    code: error?.code,
    message: String(error?.message ?? error).slice(0, 500),
  });
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
