-- AlterTable
ALTER TABLE "Business" ADD COLUMN "claimEmail" TEXT,
ADD COLUMN "claimTokenHash" TEXT,
ADD COLUMN "claimTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Business_claimEmail_idx" ON "Business"("claimEmail");

-- CreateIndex
CREATE INDEX "Business_claimTokenHash_idx" ON "Business"("claimTokenHash");
