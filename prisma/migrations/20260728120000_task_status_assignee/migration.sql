-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'TODO';
ALTER TABLE "Task" ADD COLUMN "assigneeId" TEXT;

-- Migrate existing done flag
UPDATE "Task" SET "status" = 'DONE' WHERE "done" = true;

-- DropIndex
DROP INDEX "Task_businessId_done_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "done";

-- CreateIndex
CREATE INDEX "Task_businessId_status_idx" ON "Task"("businessId", "status");

-- CreateIndex
CREATE INDEX "Task_businessId_assigneeId_idx" ON "Task"("businessId", "assigneeId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
