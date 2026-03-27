-- CreateEnum
CREATE TYPE "AssessmentTemplateType" AS ENUM ('BEHAVIORAL_360', 'IQ_COGNITIVE', 'EQ_ASSESSMENT', 'PSYCHOMETRIC');

-- CreateEnum
CREATE TYPE "ScoringStrategy" AS ENUM ('MULTI_SOURCE', 'SUM_CORRECT', 'TRAIT_AGGREGATE');

-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM (
  'LIKERT_360',
  'SINGLE_CHOICE_IQ',
  'MULTI_CHOICE_IQ',
  'EQ_SCENARIO',
  'PSYCHOMETRIC_LIKERT',
  'TEXT_SHORT',
  'FREE_TEXT'
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "AssessmentTemplateType" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB,
    "scoringStrategy" "ScoringStrategy" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- Migrate Competency rows -> AssessmentTemplate (BEHAVIORAL_360 / MULTI_SOURCE)
INSERT INTO "AssessmentTemplate" ("id", "organizationId", "type", "key", "name", "description", "config", "scoringStrategy", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT "id", "organizationId", 'BEHAVIORAL_360'::"AssessmentTemplateType", "key", "name", "description", "config", 'MULTI_SOURCE'::"ScoringStrategy", "sortOrder", "isActive", "createdAt", "updatedAt"
FROM "Competency";

-- AddForeignKey
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTemplate_organizationId_key_key" ON "AssessmentTemplate"("organizationId", "key");

-- CreateIndex
CREATE INDEX "AssessmentTemplate_organizationId_idx" ON "AssessmentTemplate"("organizationId");

-- AlterTable Question: polymorphic fields
ALTER TABLE "Question" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Question" ADD COLUMN "questionType" "AssessmentQuestionType";
ALTER TABLE "Question" ADD COLUMN "correctOptionId" TEXT;
ALTER TABLE "Question" ADD COLUMN "traitCategory" TEXT;
ALTER TABLE "Question" ADD COLUMN "weight" DECIMAL(12,4) NOT NULL DEFAULT 1;

UPDATE "Question" SET "templateId" = "competencyId";
UPDATE "Question" SET "questionType" = 'LIKERT_360'::"AssessmentQuestionType" WHERE "questionType" IS NULL;
ALTER TABLE "Question" ALTER COLUMN "questionType" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "templateId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_competencyId_fkey";

-- DropIndex
DROP INDEX "Question_competencyId_key_key";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "competencyId";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Question_templateId_key_key" ON "Question"("templateId", "key");

-- CreateIndex
CREATE INDEX "Question_templateId_idx" ON "Question"("templateId");

-- DropTable
DROP TABLE "Competency";
