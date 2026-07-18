-- AlterTable
ALTER TABLE "User" ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_disabled_idx" ON "User"("disabled");
