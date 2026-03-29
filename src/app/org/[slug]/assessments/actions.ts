"use server";

import { revalidatePath } from "next/cache";
import {
  AssessmentInstanceStatus,
  AssessmentTemplateType,
  EvaluatorRole,
  EvaluatorStatus,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { notifyEvaluatorAssigned } from "@/lib/email";
import { auth } from "@/auth";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import { requireOrgAdmin, requireOrgMember } from "@/lib/org-auth";
import { tryFinalizeAssessmentResult } from "@/lib/assessment-360-result";
import { tryFinalizeTnaAssessmentResult } from "@/lib/tna/tna-assessment-result";
import type { TnaStoredResult } from "@/lib/tna/tna-assessment-result";
import { z } from "zod";

export async function listBehavioralTemplatesForOrg(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.assessmentTemplate.findMany({
    where: {
      organizationId: tenant.organizationId,
      type: AssessmentTemplateType.BEHAVIORAL_360,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, key: true, name: true, description: true },
  });
}

export async function listTnaTemplatesForOrg(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.assessmentTemplate.findMany({
    where: {
      organizationId: tenant.organizationId,
      type: AssessmentTemplateType.TNA_DIAGNOSTIC,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, key: true, name: true, description: true },
  });
}

export async function listOrgMembersForPicker(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.organizationMember.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { email: "asc" } },
  });
}

export async function listAssessmentsForOrg(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.assessment.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      template: { select: { name: true, key: true, type: true } },
      subject: { select: { id: true, name: true, email: true } },
      evaluators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      result: { select: { id: true, computedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

const createSchema = z.object({
  slug: z.string().min(1),
  templateId: z.string().min(1),
  subjectUserId: z.string().min(1),
  title: z.string().min(1).max(200),
  managerUserId: z.string().min(1).optional().nullable(),
  peerUserIds: z.array(z.string().min(1)).default([]),
});

export async function createAssessment360(input: z.infer<typeof createSchema>) {
  const data = createSchema.parse(input);
  const { session, tenant } = await requireOrgAdmin(data.slug);

  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: data.templateId,
      organizationId: tenant.organizationId,
      type: AssessmentTemplateType.BEHAVIORAL_360,
      isActive: true,
    },
  });
  if (!template) {
    throw new Error("Template not found or not a behavioral 360 template");
  }

  const memberIds = new Set(
    (
      await prisma.organizationMember.findMany({
        where: { organizationId: tenant.organizationId },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );

  const required = [data.subjectUserId, ...data.peerUserIds, data.managerUserId].filter(
    (x): x is string => Boolean(x),
  );
  for (const uid of required) {
    if (!memberIds.has(uid)) throw new Error("All participants must belong to the organization");
  }

  const uniq = new Set(required);
  if (uniq.size !== required.length) {
    throw new Error("Each person can only appear once on this assessment");
  }

  const assessment = await prisma.assessment.create({
    data: {
      organizationId: tenant.organizationId,
      templateId: template.id,
      subjectUserId: data.subjectUserId,
      title: data.title.trim(),
      status: AssessmentInstanceStatus.ACTIVE,
      createdByUserId: session.user.id,
      evaluators: {
        create: [
          { userId: data.subjectUserId, role: EvaluatorRole.SELF, status: EvaluatorStatus.PENDING },
          ...data.peerUserIds.map((userId) => ({
            userId,
            role: EvaluatorRole.PEER,
            status: EvaluatorStatus.PENDING,
          })),
          ...(data.managerUserId
            ? [
                {
                  userId: data.managerUserId,
                  role: EvaluatorRole.MANAGER,
                  status: EvaluatorStatus.PENDING,
                },
              ]
            : []),
        ],
      },
    },
    include: {
      evaluators: { include: { user: true } },
      organization: true,
    },
  });

  for (const ev of assessment.evaluators) {
    await notifyEvaluatorAssigned({
      to: ev.user.email,
      recipientName: ev.user.name,
      assessmentTitle: assessment.title ?? template.name,
      organizationName: assessment.organization.name,
      evaluatorId: ev.id,
    });
  }

  revalidatePath(`/org/${data.slug}/assessments`);
  return assessment.id;
}

const createTnaSchema = z.object({
  slug: z.string().min(1),
  templateId: z.string().min(1),
  subjectUserId: z.string().min(1),
  title: z.string().min(1).max(200),
});

export async function createAssessmentTna(input: z.infer<typeof createTnaSchema>) {
  const data = createTnaSchema.parse(input);
  const { session, tenant } = await requireOrgAdmin(data.slug);

  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      id: data.templateId,
      organizationId: tenant.organizationId,
      type: AssessmentTemplateType.TNA_DIAGNOSTIC,
      isActive: true,
    },
  });
  if (!template) {
    throw new Error("Template not found or not a TNA diagnostic template");
  }

  const memberIds = new Set(
    (
      await prisma.organizationMember.findMany({
        where: { organizationId: tenant.organizationId },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );

  if (!memberIds.has(data.subjectUserId)) {
    throw new Error("Subject must belong to the organization");
  }

  const assessment = await prisma.assessment.create({
    data: {
      organizationId: tenant.organizationId,
      templateId: template.id,
      subjectUserId: data.subjectUserId,
      title: data.title.trim(),
      status: AssessmentInstanceStatus.ACTIVE,
      createdByUserId: session.user.id,
      evaluators: {
        create: [
          { userId: data.subjectUserId, role: EvaluatorRole.SELF, status: EvaluatorStatus.PENDING },
        ],
      },
    },
    include: {
      evaluators: { include: { user: true } },
      organization: true,
    },
  });

  for (const ev of assessment.evaluators) {
    await notifyEvaluatorAssigned({
      to: ev.user.email,
      recipientName: ev.user.name,
      assessmentTitle: assessment.title ?? template.name,
      organizationName: assessment.organization.name,
      evaluatorId: ev.id,
    });
  }

  revalidatePath(`/org/${data.slug}/assessments`);
  return assessment.id;
}

const bulkPeersSchema = z.object({
  slug: z.string().min(1),
  assessmentId: z.string().min(1),
  peerUserIds: z.array(z.string().min(1)).min(1),
});

export async function bulkAddPeers(input: z.infer<typeof bulkPeersSchema>) {
  const data = bulkPeersSchema.parse(input);
  const { tenant } = await requireOrgAdmin(data.slug);

  const assessment = await prisma.assessment.findFirst({
    where: { id: data.assessmentId, organizationId: tenant.organizationId },
    include: {
      evaluators: true,
      subject: true,
      organization: true,
      template: true,
    },
  });
  if (!assessment) throw new Error("Assessment not found");
  if (assessment.status === AssessmentInstanceStatus.COMPLETED) {
    throw new Error("Cannot add peers after the assessment is completed");
  }

  const existingUsers = new Set(assessment.evaluators.map((e) => e.userId));
  const memberIds = new Set(
    (
      await prisma.organizationMember.findMany({
        where: { organizationId: tenant.organizationId },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );

  for (const uid of data.peerUserIds) {
    if (!memberIds.has(uid)) throw new Error("User is not in this organization");
    if (existingUsers.has(uid)) throw new Error(`User already assigned: ${uid}`);
    if (uid === assessment.subjectUserId) throw new Error("Subject cannot be added as a peer");
  }

  const title = assessment.title ?? assessment.template.name;

  for (const userId of data.peerUserIds) {
    const ev = await prisma.assessmentEvaluator.create({
      data: {
        assessmentId: assessment.id,
        userId,
        role: EvaluatorRole.PEER,
        status: EvaluatorStatus.PENDING,
      },
      include: { user: true },
    });
    await notifyEvaluatorAssigned({
      to: ev.user.email,
      recipientName: ev.user.name,
      assessmentTitle: title,
      organizationName: assessment.organization.name,
      evaluatorId: ev.id,
    });
  }

  revalidatePath(`/org/${data.slug}/assessments`);
  revalidatePath(`/org/${data.slug}/assessments/${data.assessmentId}`);
}

export async function getAssessmentAdminDetail(slug: string, assessmentId: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.assessment.findFirst({
    where: { id: assessmentId, organizationId: tenant.organizationId },
    include: {
      template: true,
      subject: { select: { id: true, name: true, email: true } },
      evaluators: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      result: true,
    },
  });
}

export async function triggerScoreRecheck(slug: string, assessmentId: string) {
  const { tenant } = await requireOrgAdmin(slug);
  const ok = await prisma.assessment.findFirst({
    where: { id: assessmentId, organizationId: tenant.organizationId },
    select: { id: true },
  });
  if (!ok) throw new Error("Not found");
  await tryFinalizeAssessmentResult(assessmentId);
  await tryFinalizeTnaAssessmentResult(assessmentId);
  revalidatePath(`/org/${slug}/assessments`);
  revalidatePath(`/org/${slug}/assessments/${assessmentId}`);
  revalidatePath(`/org/${slug}/assessments/${assessmentId}/results`);
}

export type OrgAssessmentResultsView =
  | {
      kind: "360";
      assessmentId: string;
      title: string;
      subjectName: string | null;
      computedAt: Date;
      scores: Assessment360StoredResult;
    }
  | {
      kind: "tna";
      assessmentId: string;
      title: string;
      subjectName: string | null;
      computedAt: Date;
      scores: TnaStoredResult;
    }
  | {
      kind: "pending";
      assessmentId: string;
      title: string;
      subjectName: string | null;
    };

export async function getOrgAssessmentResults(
  slug: string,
  assessmentId: string,
): Promise<OrgAssessmentResultsView | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { tenant } = await requireOrgMember(slug);

  const a = await prisma.assessment.findFirst({
    where: { id: assessmentId, organizationId: tenant.organizationId },
    include: {
      result: true,
      subject: { select: { id: true, name: true } },
      template: { select: { name: true, type: true } },
    },
  });
  if (!a) return null;

  const isSubject = a.subjectUserId === session.user.id;
  const isAdmin = tenant.role === "ADMIN" || tenant.role === "SUPER_ADMIN";
  if (!isSubject && !isAdmin) return null;

  const title = a.title ?? a.template.name;
  const subjectName = a.subject.name;

  if (!a.result) {
    return {
      kind: "pending",
      assessmentId: a.id,
      title,
      subjectName,
    };
  }

  if (a.template.type === AssessmentTemplateType.TNA_DIAGNOSTIC) {
    return {
      kind: "tna",
      assessmentId: a.id,
      title,
      subjectName,
      computedAt: a.result.computedAt,
      scores: a.result.competencyScores as unknown as TnaStoredResult,
    };
  }

  if (a.template.type === AssessmentTemplateType.BEHAVIORAL_360) {
    return {
      kind: "360",
      assessmentId: a.id,
      title,
      subjectName,
      computedAt: a.result.computedAt,
      scores: a.result.competencyScores as unknown as Assessment360StoredResult,
    };
  }

  return null;
}
