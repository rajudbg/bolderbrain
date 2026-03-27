-- CreateEnum
CREATE TYPE "IqAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- AlterEnum (append new IQ item types)
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'NUMERICAL_SEQUENCE';
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'VERBAL_ANALOGY';
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'LOGICAL_PATTERN';
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'SPATIAL_REASONING';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "timeLimitSeconds" INTEGER;

-- CreateTable
CREATE TABLE "IqTestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "IqAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3) NOT NULL,
    "questionIds" JSONB NOT NULL,
    "responses" JSONB,
    "flaggedIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IqTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IqTestResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "rawCorrectCount" INTEGER NOT NULL,
    "weightedScore" DOUBLE PRECISION NOT NULL,
    "maxWeighted" DOUBLE PRECISION NOT NULL,
    "standardScore" DOUBLE PRECISION NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "ciLow" DOUBLE PRECISION NOT NULL,
    "ciHigh" DOUBLE PRECISION NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "breakdownByCategory" JSONB NOT NULL,
    "interpretation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IqTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IqTestResult_attemptId_key" ON "IqTestResult"("attemptId");

-- CreateIndex
CREATE INDEX "IqTestAttempt_userId_templateId_idx" ON "IqTestAttempt"("userId", "templateId");

-- CreateIndex
CREATE INDEX "IqTestAttempt_organizationId_idx" ON "IqTestAttempt"("organizationId");

-- CreateIndex
CREATE INDEX "IqTestAttempt_templateId_idx" ON "IqTestAttempt"("templateId");

-- AddForeignKey
ALTER TABLE "IqTestAttempt" ADD CONSTRAINT "IqTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IqTestAttempt" ADD CONSTRAINT "IqTestAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IqTestAttempt" ADD CONSTRAINT "IqTestAttempt_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IqTestResult" ADD CONSTRAINT "IqTestResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "IqTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
