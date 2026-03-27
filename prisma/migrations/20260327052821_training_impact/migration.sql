-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('INVITED', 'PRE_COMPLETED', 'TRAINING_COMPLETED', 'POST_COMPLETED');

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "preOpensAt" TIMESTAMP(3) NOT NULL,
    "preClosesAt" TIMESTAMP(3) NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "postOpensAt" TIMESTAMP(3) NOT NULL,
    "postClosesAt" TIMESTAMP(3) NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'DRAFT',
    "attendanceCount" INTEGER,
    "attendanceExpected" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preAssignmentId" TEXT,
    "postAssignmentId" TEXT,
    "preScores" JSONB,
    "postScores" JSONB,
    "delta" JSONB,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'INVITED',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingProgram_organizationId_idx" ON "TrainingProgram"("organizationId");

-- CreateIndex
CREATE INDEX "TrainingProgram_status_idx" ON "TrainingProgram"("status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_userId_idx" ON "TrainingEnrollment"("userId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_trainingProgramId_idx" ON "TrainingEnrollment"("trainingProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_trainingProgramId_userId_key" ON "TrainingEnrollment"("trainingProgramId", "userId");

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
