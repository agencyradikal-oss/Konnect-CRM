-- AlterTable
ALTER TABLE "Business" ADD COLUMN "webhookUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN "webhookSecret" TEXT;
ALTER TABLE "Business" ADD COLUMN "webhookEnabled" BOOLEAN NOT NULL DEFAULT false;
