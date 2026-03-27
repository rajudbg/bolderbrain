-- AlterEnum
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'EQ_SELF_REPORT';

-- CreateEnum
CREATE TYPE "EqAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "reverseScored" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EqTestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "EqAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "questionIds" JSONB NOT NULL,
    "responses" JSONB,
    "currentSectionIndex" INTEGER NOT NULL DEFAULT 0,
    "lastSavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EqTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EqTestResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "domainScores" JSONB NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "percentileComposite" DOUBLE PRECISION NOT NULL,
    "percentileByDomain" JSONB NOT NULL,
    "highestDomain" TEXT NOT NULL,
    "lowestDomain" TEXT NOT NULL,
    "consistencyFlags" JSONB NOT NULL,
    "narrativeText" TEXT NOT NULL,
    "quadrantLabel" TEXT NOT NULL,
    "heatmapPosition" JSONB NOT NULL,
    "previousSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EqTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EqTestResult_attemptId_key" ON "EqTestResult"("attemptId");

-- CreateIndex
CREATE INDEX "EqTestAttempt_userId_templateId_idx" ON "EqTestAttempt"("userId", "templateId");

-- CreateIndex
CREATE INDEX "EqTestAttempt_organizationId_idx" ON "EqTestAttempt"("organizationId");

-- CreateIndex
CREATE INDEX "EqTestAttempt_templateId_idx" ON "EqTestAttempt"("templateId");

-- AddForeignKey
ALTER TABLE "EqTestAttempt" ADD CONSTRAINT "EqTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EqTestAttempt" ADD CONSTRAINT "EqTestAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EqTestAttempt" ADD CONSTRAINT "EqTestAttempt_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EqTestResult" ADD CONSTRAINT "EqTestResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "EqTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN "sourceEqAttemptId" TEXT;

-- CreateIndex
CREATE INDEX "UserAction_sourceEqAttemptId_idx" ON "UserAction"("sourceEqAttemptId");
