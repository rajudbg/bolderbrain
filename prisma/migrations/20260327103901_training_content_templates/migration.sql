-- CreateEnum
CREATE TYPE "TrainingContentTemplateKind" AS ENUM ('KNOWLEDGE_TEST', 'BEHAVIORAL_TEST');

-- CreateEnum
CREATE TYPE "TrainingContentQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'LIKERT_5_SCALE', 'LIKERT_FREQUENCY', 'SEMANTIC_DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "TrainingAttemptPhase" AS ENUM ('PRE', 'POST');

-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN     "allowRetake" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partialCredit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passThresholdPercent" INTEGER,
ADD COLUMN     "questionPoolCount" INTEGER,
ADD COLUMN     "randomizePerParticipant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoringMode" VARCHAR(50),
ADD COLUMN     "shufflePostOptions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shufflePostQuestions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timerOverrideMinutes" INTEGER,
ADD COLUMN     "trainingContentTemplateId" TEXT,
ALTER COLUMN "templateId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TrainingContentTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "kind" "TrainingContentTemplateKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minQuestions" INTEGER NOT NULL DEFAULT 5,
    "maxQuestions" INTEGER NOT NULL DEFAULT 50,
    "defaultQuestionCount" INTEGER NOT NULL DEFAULT 20,
    "hasTimer" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitMinutes" INTEGER,
    "defaultOptionCount" INTEGER NOT NULL DEFAULT 4,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingContentQuestion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "TrainingContentQuestionType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "correctOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "points" INTEGER NOT NULL DEFAULT 1,
    "competencyKey" TEXT,
    "reverseScored" BOOLEAN NOT NULL DEFAULT false,
    "minOptions" INTEGER NOT NULL DEFAULT 3,
    "maxOptions" INTEGER NOT NULL DEFAULT 6,
    "explanation" TEXT,

    CONSTRAINT "TrainingContentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingContentOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingContentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttempt" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "trainingEnrollmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" "TrainingAttemptPhase" NOT NULL,
    "questionOrder" JSONB NOT NULL,
    "optionShuffle" JSONB,
    "responses" JSONB,
    "scoreJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "TrainingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingContentTemplate_organizationId_idx" ON "TrainingContentTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "TrainingContentQuestion_templateId_idx" ON "TrainingContentQuestion"("templateId");

-- CreateIndex
CREATE INDEX "TrainingContentOption_questionId_idx" ON "TrainingContentOption"("questionId");

-- CreateIndex
CREATE INDEX "TrainingAttempt_trainingProgramId_idx" ON "TrainingAttempt"("trainingProgramId");

-- CreateIndex
CREATE INDEX "TrainingAttempt_userId_idx" ON "TrainingAttempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttempt_trainingEnrollmentId_phase_key" ON "TrainingAttempt"("trainingEnrollmentId", "phase");

-- AddForeignKey
ALTER TABLE "TrainingContentTemplate" ADD CONSTRAINT "TrainingContentTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingContentQuestion" ADD CONSTRAINT "TrainingContentQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingContentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingContentOption" ADD CONSTRAINT "TrainingContentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TrainingContentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttempt" ADD CONSTRAINT "TrainingAttempt_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttempt" ADD CONSTRAINT "TrainingAttempt_trainingEnrollmentId_fkey" FOREIGN KEY ("trainingEnrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttempt" ADD CONSTRAINT "TrainingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_trainingContentTemplateId_fkey" FOREIGN KEY ("trainingContentTemplateId") REFERENCES "TrainingContentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
