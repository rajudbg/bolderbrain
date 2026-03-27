-- Phase 11: hot-path FK indexes for tenant-scoped queries and 360 response joins
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentResponse_evaluatorId_idx" ON "AssessmentResponse"("evaluatorId");
