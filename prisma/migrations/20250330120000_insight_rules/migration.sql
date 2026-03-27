-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('INFO', 'WARNING', 'POSITIVE');

-- CreateTable
CREATE TABLE "InsightRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "competencyKey" TEXT,
    "minGap" DECIMAL(6,3) NOT NULL,
    "maxGap" DECIMAL(6,3) NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'INFO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsightRule_organizationId_idx" ON "InsightRule"("organizationId");

-- CreateIndex
CREATE INDEX "InsightRule_isActive_idx" ON "InsightRule"("isActive");

-- AddForeignKey
ALTER TABLE "InsightRule" ADD CONSTRAINT "InsightRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
