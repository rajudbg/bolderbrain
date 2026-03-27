-- Phase 10: HR admin analytics (departments, user status, 360 due dates)

ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "OrganizationMember" ADD COLUMN "department" TEXT;

ALTER TABLE "Assessment" ADD COLUMN "dueAt" TIMESTAMP(3);
