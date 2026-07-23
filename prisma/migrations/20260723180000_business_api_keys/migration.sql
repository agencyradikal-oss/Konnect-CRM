-- CreateTable
CREATE TABLE "BusinessApiKey" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessApiKey_businessId_idx" ON "BusinessApiKey"("businessId");

-- CreateIndex
CREATE INDEX "BusinessApiKey_keyHash_idx" ON "BusinessApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "BusinessApiKey_revokedAt_idx" ON "BusinessApiKey"("revokedAt");

-- AddForeignKey
ALTER TABLE "BusinessApiKey" ADD CONSTRAINT "BusinessApiKey_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
