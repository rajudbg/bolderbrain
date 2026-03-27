-- AlterEnum
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'FORCED_CHOICE_IPSATIVE';
ALTER TYPE "AssessmentQuestionType" ADD VALUE 'SEMANTIC_DIFFERENTIAL';

-- CreateEnum
CREATE TYPE "PsychAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "PsychTestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "PsychAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "questionIds" JSONB NOT NULL,
    "responses" JSONB,
    "currentPageIndex" INTEGER NOT NULL DEFAULT 0,
    "lastSavedAt" TIMESTAMP(3),
    "itemTimings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychTestResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "traitPercentiles" JSONB NOT NULL,
    "rawTraitSums" JSONB NOT NULL,
    "validityFlags" JSONB NOT NULL,
    "roleMatches" JSONB NOT NULL,
    "teamDynamicsText" TEXT NOT NULL,
    "careerInsightsText" TEXT NOT NULL,
    "summaryLine" TEXT NOT NULL,
    "radarPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychTestResult_attemptId_key" ON "PsychTestResult"("attemptId");

-- CreateIndex
CREATE INDEX "PsychTestAttempt_userId_templateId_idx" ON "PsychTestAttempt"("userId", "templateId");

-- CreateIndex
CREATE INDEX "PsychTestAttempt_organizationId_idx" ON "PsychTestAttempt"("organizationId");

-- CreateIndex
CREATE INDEX "PsychTestAttempt_templateId_idx" ON "PsychTestAttempt"("templateId");

-- AddForeignKey
ALTER TABLE "PsychTestAttempt" ADD CONSTRAINT "PsychTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychTestAttempt" ADD CONSTRAINT "PsychTestAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychTestAttempt" ADD CONSTRAINT "PsychTestAttempt_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychTestResult" ADD CONSTRAINT "PsychTestResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PsychTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN "sourcePsychAttemptId" TEXT;

-- CreateIndex
CREATE INDEX "UserAction_sourcePsychAttemptId_idx" ON "UserAction"("sourcePsychAttemptId");
