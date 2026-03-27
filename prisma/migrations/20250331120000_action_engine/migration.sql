-- CreateEnum
CREATE TYPE "ActionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "UserActionStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "UserActionSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "ActionDifficulty" NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "UserActionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "source" "UserActionSource" NOT NULL DEFAULT 'AUTO',
    "weekKey" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "dismissReason" TEXT,
    "sourceAssessmentId" TEXT,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "competencyKey" TEXT NOT NULL,
    "self" DOUBLE PRECISION,
    "peerAvg" DOUBLE PRECISION,
    "manager" DOUBLE PRECISION,
    "othersAverage" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetencyScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevelopmentStreak" (
    "userId" TEXT NOT NULL,
    "consecutiveWeeksCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastCountedWeekKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDevelopmentStreak_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competency_organizationId_key_key" ON "Competency"("organizationId", "key");

-- CreateIndex
CREATE INDEX "Competency_organizationId_idx" ON "Competency"("organizationId");

-- CreateIndex
CREATE INDEX "Action_competencyId_idx" ON "Action"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAction_userId_actionId_weekKey_key" ON "UserAction"("userId", "actionId", "weekKey");

-- CreateIndex
CREATE INDEX "UserAction_userId_weekKey_idx" ON "UserAction"("userId", "weekKey");

-- CreateIndex
CREATE INDEX "UserAction_userId_status_idx" ON "UserAction"("userId", "status");

-- CreateIndex
CREATE INDEX "UserAction_organizationId_idx" ON "UserAction"("organizationId");

-- CreateIndex
CREATE INDEX "UserAction_sourceAssessmentId_idx" ON "UserAction"("sourceAssessmentId");

-- CreateIndex
CREATE INDEX "CompetencyScoreSnapshot_userId_recordedAt_idx" ON "CompetencyScoreSnapshot"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "CompetencyScoreSnapshot_userId_competencyKey_recordedAt_idx" ON "CompetencyScoreSnapshot"("userId", "competencyKey", "recordedAt");

-- CreateIndex
CREATE INDEX "CompetencyScoreSnapshot_assessmentId_idx" ON "CompetencyScoreSnapshot"("assessmentId");

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyScoreSnapshot" ADD CONSTRAINT "CompetencyScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyScoreSnapshot" ADD CONSTRAINT "CompetencyScoreSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyScoreSnapshot" ADD CONSTRAINT "CompetencyScoreSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevelopmentStreak" ADD CONSTRAINT "UserDevelopmentStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
