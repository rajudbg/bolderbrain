import {
  OrgAssessmentAssignmentKind,
  OrgAssessmentAssignmentStatus,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { OrgAssessmentAssignment } from "@/generated/prisma/client";

function kindMatchesTemplate(
  kind: OrgAssessmentAssignmentKind,
  templateType: string,
): boolean {
  const map: Record<OrgAssessmentAssignmentKind, string> = {
    [OrgAssessmentAssignmentKind.IQ_COGNITIVE]: "IQ_COGNITIVE",
    [OrgAssessmentAssignmentKind.EQ_ASSESSMENT]: "EQ_ASSESSMENT",
    [OrgAssessmentAssignmentKind.PSYCHOMETRIC]: "PSYCHOMETRIC",
  };
  return map[kind] === templateType;
}

/** Derive status from attempts after assignment was created. */
export async function computeOrgAssignmentStatus(
  row: Pick<OrgAssessmentAssignment, "id" | "kind" | "assignedUserId" | "templateId" | "createdAt" | "status">,
): Promise<OrgAssessmentAssignmentStatus> {
  if (row.status === OrgAssessmentAssignmentStatus.CANCELLED) {
    return OrgAssessmentAssignmentStatus.CANCELLED;
  }

  const after = row.createdAt;

  switch (row.kind) {
    case OrgAssessmentAssignmentKind.IQ_COGNITIVE: {
      const done = await prisma.iqTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: { not: null, gte: after },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (done) return OrgAssessmentAssignmentStatus.COMPLETED;
      const open = await prisma.iqTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: null,
          startedAt: { gte: after },
        },
      });
      if (open) return OrgAssessmentAssignmentStatus.IN_PROGRESS;
      return OrgAssessmentAssignmentStatus.PENDING;
    }
    case OrgAssessmentAssignmentKind.EQ_ASSESSMENT: {
      const done = await prisma.eqTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: { not: null, gte: after },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (done) return OrgAssessmentAssignmentStatus.COMPLETED;
      const open = await prisma.eqTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: null,
          startedAt: { gte: after },
        },
      });
      if (open) return OrgAssessmentAssignmentStatus.IN_PROGRESS;
      return OrgAssessmentAssignmentStatus.PENDING;
    }
    case OrgAssessmentAssignmentKind.PSYCHOMETRIC: {
      const done = await prisma.psychTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: { not: null, gte: after },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (done) return OrgAssessmentAssignmentStatus.COMPLETED;
      const open = await prisma.psychTestAttempt.findFirst({
        where: {
          userId: row.assignedUserId,
          templateId: row.templateId,
          submittedAt: null,
          startedAt: { gte: after },
        },
      });
      if (open) return OrgAssessmentAssignmentStatus.IN_PROGRESS;
      return OrgAssessmentAssignmentStatus.PENDING;
    }
    default:
      return OrgAssessmentAssignmentStatus.PENDING;
  }
}

export async function syncOrgAssignmentRow(id: string): Promise<void> {
  const row = await prisma.orgAssessmentAssignment.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      assignedUserId: true,
      templateId: true,
      createdAt: true,
      status: true,
    },
  });
  if (!row || row.status === OrgAssessmentAssignmentStatus.CANCELLED) return;
  const next = await computeOrgAssignmentStatus(row);
  if (next !== row.status) {
    await prisma.orgAssessmentAssignment.update({
      where: { id: row.id },
      data: { status: next },
    });
  }
}

export async function syncAllOrgAssignments(orgId: string): Promise<void> {
  const rows = await prisma.orgAssessmentAssignment.findMany({
    where: {
      organizationId: orgId,
      status: { not: OrgAssessmentAssignmentStatus.CANCELLED },
    },
    select: {
      id: true,
      kind: true,
      assignedUserId: true,
      templateId: true,
      createdAt: true,
      status: true,
    },
  });
  for (const row of rows) {
    const next = await computeOrgAssignmentStatus(row);
    if (next !== row.status) {
      await prisma.orgAssessmentAssignment.update({
        where: { id: row.id },
        data: { status: next },
      });
    }
  }
}

export { kindMatchesTemplate };
