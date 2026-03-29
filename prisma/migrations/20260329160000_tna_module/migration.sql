-- AlterEnum (PostgreSQL: new value for existing enum)
ALTER TYPE "AssessmentTemplateType" ADD VALUE 'TNA_DIAGNOSTIC';

-- CreateEnum
CREATE TYPE "CompetencyCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TrainingNeedSource" AS ENUM ('TNA_ASSESSMENT', 'MANAGER_NOMINATION', 'SELF_IDENTIFIED');

-- CreateEnum
CREATE TYPE "TrainingNeedStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "GapSeverity" AS ENUM ('EXCEEDS', 'MET', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "CompetencyTarget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "department" TEXT,
    "careerLevel" TEXT,
    "targetScore" DOUBLE PRECISION NOT NULL,
    "minimumScore" DOUBLE PRECISION NOT NULL,
    "criticality" "CompetencyCriticality" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingNeed" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION,
    "targetScore" DOUBLE PRECISION NOT NULL,
    "gap" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" "TrainingNeedSource" NOT NULL,
    "status" "TrainingNeedStatus" NOT NULL DEFAULT 'OPEN',
    "assignedProgramId" TEXT,
    "sourceAssessmentId" TEXT,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillsInventory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL,
    "targetScore" DOUBLE PRECISION NOT NULL,
    "gap" DOUBLE PRECISION NOT NULL,
    "severity" "GapSeverity" NOT NULL,
    "gapCountHint" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillsInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetencyTarget_organizationId_idx" ON "CompetencyTarget"("organizationId");

-- CreateIndex
CREATE INDEX "CompetencyTarget_competencyId_idx" ON "CompetencyTarget"("competencyId");

-- CreateIndex
CREATE INDEX "TrainingNeed_organizationId_status_idx" ON "TrainingNeed"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrainingNeed_userId_status_idx" ON "TrainingNeed"("userId", "status");

-- CreateIndex
CREATE INDEX "TrainingNeed_competencyId_idx" ON "TrainingNeed"("competencyId");

-- CreateIndex
CREATE INDEX "TrainingNeed_priority_idx" ON "TrainingNeed"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SkillsInventory_userId_organizationId_competencyId_key" ON "SkillsInventory"("userId", "organizationId", "competencyId");

-- CreateIndex
CREATE INDEX "SkillsInventory_organizationId_idx" ON "SkillsInventory"("organizationId");

-- AddForeignKey
ALTER TABLE "CompetencyTarget" ADD CONSTRAINT "CompetencyTarget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyTarget" ADD CONSTRAINT "CompetencyTarget_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNeed" ADD CONSTRAINT "TrainingNeed_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNeed" ADD CONSTRAINT "TrainingNeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNeed" ADD CONSTRAINT "TrainingNeed_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNeed" ADD CONSTRAINT "TrainingNeed_assignedProgramId_fkey" FOREIGN KEY ("assignedProgramId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNeed" ADD CONSTRAINT "TrainingNeed_sourceAssessmentId_fkey" FOREIGN KEY ("sourceAssessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsInventory" ADD CONSTRAINT "SkillsInventory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsInventory" ADD CONSTRAINT "SkillsInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsInventory" ADD CONSTRAINT "SkillsInventory_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
