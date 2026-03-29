"use server";

import { auth } from "@/auth";
import {
  AssessmentTemplateType,
  OrgAssessmentAssignmentKind,
  OrgAssessmentAssignmentStatus,
} from "@/generated/prisma/enums";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { notifyEmployeeSelfAssessmentAssigned } from "@/lib/email";
import { syncOrgAssignmentRow } from "@/lib/org-assignment-status";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const kindToTemplateType: Record<OrgAssessmentAssignmentKind, AssessmentTemplateType> = {
  [OrgAssessmentAssignmentKind.IQ_COGNITIVE]: AssessmentTemplateType.IQ_COGNITIVE,
  [OrgAssessmentAssignmentKind.EQ_ASSESSMENT]: AssessmentTemplateType.EQ_ASSESSMENT,
  [OrgAssessmentAssignmentKind.PSYCHOMETRIC]: AssessmentTemplateType.PSYCHOMETRIC,
};

const appPathForKind: Record<OrgAssessmentAssignmentKind, string> = {
  [OrgAssessmentAssignmentKind.IQ_COGNITIVE]: "/app/assessments/iq",
  [OrgAssessmentAssignmentKind.EQ_ASSESSMENT]: "/app/assessments/eq",
  [OrgAssessmentAssignmentKind.PSYCHOMETRIC]: "/app/assessments/psychometric",
};

const createSchema = z.object({
  kind: z.nativeEnum(OrgAssessmentAssignmentKind),
  templateId: z.string().min(1),
  assignedUserIds: z.array(z.string().min(1)).min(1).max(200),
  dueAt: z.coerce.date().optional().nullable(),
  sendEmail: z.boolean().optional(),
});

export async function listTemplatesForAssignmentKind(kind: OrgAssessmentAssignmentKind) {
  const orgId = await requireAdminOrganizationId();
  const t = kindToTemplateType[kind];
  return prisma.assessmentTemplate.findMany({
    where: { organizationId: orgId, type: t, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, key: true, name: true },
  });
}

export async function listOrgAssignmentsForAdmin() {
  const orgId = await requireAdminOrganizationId();
  const { syncAllOrgAssignments } = await import("@/lib/org-assignment-status");
  await syncAllOrgAssignments(orgId);

  return prisma.orgAssessmentAssignment.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      assignedUser: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, name: true, type: true } },
    },
    take: 500,
  });
}

export async function createOrgAssessmentAssignments(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  const assignerId = session?.user?.id ?? null;

  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: data.templateId,
      organizationId: orgId,
      isActive: true,
      type: kindToTemplateType[data.kind],
    },
  });
  if (!template) {
    throw new Error("Template not found for this assessment type");
  }

  const memberIds = new Set(
    (
      await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );
  for (const uid of data.assignedUserIds) {
    if (!memberIds.has(uid)) throw new Error("All assignees must belong to the organization");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  if (!org) throw new Error("Organization not found");

  const basePath = appPathForKind[data.kind];
  const appPath = `${basePath}?focusTemplate=${encodeURIComponent(template.id)}`;

  const created: string[] = [];
  for (const userId of data.assignedUserIds) {
    const row = await prisma.orgAssessmentAssignment.create({
      data: {
        organizationId: orgId,
        assignedUserId: userId,
        assignerUserId: assignerId,
        kind: data.kind,
        templateId: template.id,
        dueAt: data.dueAt ?? null,
        status: OrgAssessmentAssignmentStatus.PENDING,
      },
    });
    created.push(row.id);

    if (data.sendEmail !== false) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      await notifyEmployeeSelfAssessmentAssigned({
        to: user?.email,
        recipientName: user?.name ?? null,
        organizationName: org.name,
        templateName: template.name,
        kindKey: data.kind,
        appPath,
      });
    }
  }

  revalidatePath("/admin/assessment-programs");
  revalidatePath("/admin");
  return { created: created.length };
}

export async function remindOrgAssignment(assignmentId: string) {
  const orgId = await requireAdminOrganizationId();
  const row = await prisma.orgAssessmentAssignment.findFirst({
    where: { id: assignmentId, organizationId: orgId },
    include: {
      assignedUser: { select: { email: true, name: true } },
      template: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });
  if (!row) throw new Error("Assignment not found");
  if (row.status === OrgAssessmentAssignmentStatus.COMPLETED) {
    return { ok: false as const, message: "Already completed" };
  }
  if (row.status === OrgAssessmentAssignmentStatus.CANCELLED) {
    return { ok: false as const, message: "Assignment cancelled" };
  }

  await syncOrgAssignmentRow(row.id);
  const fresh = await prisma.orgAssessmentAssignment.findUnique({ where: { id: row.id } });
  if (fresh?.status === OrgAssessmentAssignmentStatus.COMPLETED) {
    return { ok: false as const, message: "Already completed" };
  }

  const basePath = appPathForKind[row.kind];
  const appPath = `${basePath}?focusTemplate=${encodeURIComponent(row.templateId)}`;

  await notifyEmployeeSelfAssessmentAssigned({
    to: row.assignedUser.email,
    recipientName: row.assignedUser.name,
    organizationName: row.organization.name,
    templateName: row.template.name,
    kindKey: row.kind,
    appPath,
  });

  await prisma.orgAssessmentAssignment.update({
    where: { id: row.id },
    data: { lastReminderAt: new Date() },
  });

  revalidatePath("/admin/assessment-programs");
  return { ok: true as const, message: "Reminder sent (email when configured)." };
}

export async function cancelOrgAssignment(assignmentId: string) {
  const orgId = await requireAdminOrganizationId();
  await prisma.orgAssessmentAssignment.updateMany({
    where: { id: assignmentId, organizationId: orgId },
    data: { status: OrgAssessmentAssignmentStatus.CANCELLED },
  });
  revalidatePath("/admin/assessment-programs");
}
