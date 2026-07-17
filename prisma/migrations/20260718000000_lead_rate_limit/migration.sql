-- CreateTable
CREATE TABLE "LeadRateLimit" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadRateLimit_ipHash_createdAt_idx" ON "LeadRateLimit"("ipHash", "createdAt");
