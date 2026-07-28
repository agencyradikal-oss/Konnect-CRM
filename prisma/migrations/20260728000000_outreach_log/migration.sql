-- CreateTable
CREATE TABLE "OutreachLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "toValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachLog_businessId_createdAt_idx" ON "OutreachLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachLog_businessId_channel_createdAt_idx" ON "OutreachLog"("businessId", "channel", "createdAt");

-- AddForeignKey
ALTER TABLE "OutreachLog" ADD CONSTRAINT "OutreachLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
