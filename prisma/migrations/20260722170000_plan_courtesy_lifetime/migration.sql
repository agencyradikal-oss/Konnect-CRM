-- AlterTable
ALTER TABLE "Business" ADD COLUMN "planCourtesy" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Business_planCourtesy_idx" ON "Business"("planCourtesy");

-- CreateTable
CREATE TABLE "PlanCourtesyEntitlement" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'PREMIUM',
    "note" TEXT,
    "businessId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCourtesyEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanCourtesyEntitlement_email_key" ON "PlanCourtesyEntitlement"("email");

-- CreateIndex
CREATE INDEX "PlanCourtesyEntitlement_businessId_idx" ON "PlanCourtesyEntitlement"("businessId");

-- CreateIndex
CREATE INDEX "PlanCourtesyEntitlement_revokedAt_idx" ON "PlanCourtesyEntitlement"("revokedAt");

-- AddForeignKey
ALTER TABLE "PlanCourtesyEntitlement" ADD CONSTRAINT "PlanCourtesyEntitlement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bootstrap primer socio (All In Remodeling)
INSERT INTO "PlanCourtesyEntitlement" ("id", "email", "plan", "note", "grantedAt", "createdAt", "updatedAt")
VALUES (
  'courtesy_allin_bootstrap',
  'allinremodelingcompany@gmail.com',
  'PREMIUM',
  'Socio — lifetime cortesía',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Si el usuario ya tiene negocio, aplicar Premium de cortesía de inmediato
UPDATE "Business" AS b
SET
  plan = 'PREMIUM',
  "planCourtesy" = true,
  featured = true
FROM "User" AS u
INNER JOIN "PlanCourtesyEntitlement" AS e ON e.email = u.email
WHERE
  e.email = 'allinremodelingcompany@gmail.com'
  AND e."revokedAt" IS NULL
  AND u."businessId" = b.id;

UPDATE "PlanCourtesyEntitlement" AS e
SET "businessId" = u."businessId", "updatedAt" = CURRENT_TIMESTAMP
FROM "User" AS u
WHERE
  e.email = 'allinremodelingcompany@gmail.com'
  AND e."revokedAt" IS NULL
  AND u.email = e.email
  AND u."businessId" IS NOT NULL;
