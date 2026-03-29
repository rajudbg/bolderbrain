-- CreateEnum
CREATE TYPE "OrgAssessmentAssignmentKind" AS ENUM ('IQ_COGNITIVE', 'EQ_ASSESSMENT', 'PSYCHOMETRIC');

-- CreateEnum
CREATE TYPE "OrgAssessmentAssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OrgAssessmentAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    "assignerUserId" TEXT,
    "kind" "OrgAssessmentAssignmentKind" NOT NULL,
    "templateId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "OrgAssessmentAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgAssessmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgAssessmentAssignment_organizationId_idx" ON "OrgAssessmentAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "OrgAssessmentAssignment_assignedUserId_idx" ON "OrgAssessmentAssignment"("assignedUserId");

-- CreateIndex
CREATE INDEX "OrgAssessmentAssignment_organizationId_status_idx" ON "OrgAssessmentAssignment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrgAssessmentAssignment_templateId_idx" ON "OrgAssessmentAssignment"("templateId");

-- AddForeignKey
ALTER TABLE "OrgAssessmentAssignment" ADD CONSTRAINT "OrgAssessmentAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssessmentAssignment" ADD CONSTRAINT "OrgAssessmentAssignment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssessmentAssignment" ADD CONSTRAINT "OrgAssessmentAssignment_assignerUserId_fkey" FOREIGN KEY ("assignerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssessmentAssignment" ADD CONSTRAINT "OrgAssessmentAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
