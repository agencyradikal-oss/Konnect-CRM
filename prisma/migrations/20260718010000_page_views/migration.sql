-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_businessId_createdAt_idx" ON "PageView"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_slug_createdAt_idx" ON "PageView"("slug", "createdAt");

-- CreateIndex
CREATE INDEX "Business_stripeCustomerId_idx" ON "Business"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
