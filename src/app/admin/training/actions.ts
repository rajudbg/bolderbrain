"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import {
  AssessmentInstanceStatus,
  AssessmentTemplateType,
  EnrollmentStatus,
  EvaluatorRole,
  EvaluatorStatus,
  TrainingAttemptPhase,
  TrainingStatus,
} from "@/generated/prisma/enums";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { notifyEvaluatorAssigned } from "@/lib/email";
import prisma from "@/lib/prisma";
import { buildRuntimeForAttempt } from "@/lib/training-content-attempts";

const createProgramSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    assessmentMode: z.enum(["behavioral_360", "content"]),
    templateId: z.string().optional(),
    trainingContentTemplateId: z.string().optional(),
    questionPoolCount: z.coerce.number().int().min(5).max(50).optional().nullable(),
    /// Content programs only — post-assessment shuffle (defaults true in DB).
    shufflePostQuestions: z.boolean().optional(),
    shufflePostOptions: z.boolean().optional(),
    /// Overrides template timer when set (minutes).
    timerOverrideMinutes: z.coerce.number().int().min(5).max(300).optional().nullable(),
    partialCredit: z.boolean().optional(),
    preOpensAt: z.coerce.date(),
    preClosesAt: z.coerce.date(),
    trainingDate: z.coerce.date(),
    postOpensAt: z.coerce.date(),
    postClosesAt: z.coerce.date(),
    enrollUserIds: z.array(z.string().min(1)).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.assessmentMode === "behavioral_360") {
      if (!data.templateId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a behavioral 360 template", path: ["templateId"] });
      }
    } else if (!data.trainingContentTemplateId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a training content template",
        path: ["trainingContentTemplateId"],
      });
    }
  });

export async function listBehavioralTemplatesForTraining() {
  const orgId = await requireAdminOrganizationId();
  return prisma.assessmentTemplate.findMany({
    where: { organizationId: orgId, type: AssessmentTemplateType.BEHAVIORAL_360, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, key: true, name: true },
  });
}

export async function listOrgMembersForTraining() {
  const orgId = await requireAdminOrganizationId();
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { email: "asc" } },
  });
}

export async function listTrainingContentTemplatesForOrg() {
  const orgId = await requireAdminOrganizationId();
  return prisma.trainingContentTemplate.findMany({
    where: {
      isPublished: true,
      OR: [{ organizationId: null }, { organizationId: orgId }],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, kind: true, _count: { select: { questions: true } } },
  });
}

export async function listTrainingPrograms() {
  const orgId = await requireAdminOrganizationId();
  return prisma.trainingProgram.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });
}

export async function getTrainingProgram(id: string) {
  const orgId = await requireAdminOrganizationId();
  return prisma.trainingProgram.findFirst({
    where: { id, organizationId: orgId },
    include: {
      template: { select: { id: true, name: true, key: true } },
      trainingContentTemplate: { select: { id: true, name: true, kind: true } },
      enrollments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { user: { email: "asc" } },
      },
    },
  });
}

export async function createTrainingProgram(input: z.infer<typeof createProgramSchema>) {
  const data = createProgramSchema.parse(input);
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (data.preClosesAt <= data.preOpensAt) throw new Error("Pre window: close must be after open");
  if (data.postClosesAt <= data.postOpensAt) throw new Error("Post window: close must be after open");
  if (data.trainingDate < data.preOpensAt) throw new Error("Training date should be on or after pre window opens");

  const memberIds = new Set(
    (await prisma.organizationMember.findMany({ where: { organizationId: orgId }, select: { userId: true } })).map(
      (m) => m.userId,
    ),
  );
  for (const uid of data.enrollUserIds) {
    if (!memberIds.has(uid)) throw new Error("All participants must belong to the organization");
  }

  if (data.assessmentMode === "behavioral_360") {
    const template = await prisma.assessmentTemplate.findFirst({
      where: {
        id: data.templateId,
        organizationId: orgId,
        type: AssessmentTemplateType.BEHAVIORAL_360,
        isActive: true,
      },
    });
    if (!template) throw new Error("Select a valid behavioral 360 template");

    const program = await prisma.trainingProgram.create({
      data: {
        organizationId: orgId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        templateId: template.id,
        preOpensAt: data.preOpensAt,
        preClosesAt: data.preClosesAt,
        trainingDate: data.trainingDate,
        postOpensAt: data.postOpensAt,
        postClosesAt: data.postClosesAt,
        status: TrainingStatus.DRAFT,
        enrollments: {
          create: data.enrollUserIds.map((userId) => ({
            userId,
            status: EnrollmentStatus.INVITED,
          })),
        },
      },
    });
    revalidatePath("/admin/training");
    return program.id;
  }

  const contentTpl = await prisma.trainingContentTemplate.findFirst({
    where: {
      id: data.trainingContentTemplateId,
      isPublished: true,
      OR: [{ organizationId: null }, { organizationId: orgId }],
    },
  });
  if (!contentTpl) throw new Error("Select a valid training content template");

  const program = await prisma.trainingProgram.create({
    data: {
      organizationId: orgId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      templateId: null,
      trainingContentTemplateId: contentTpl.id,
      questionPoolCount: data.questionPoolCount ?? null,
      shufflePostQuestions: data.shufflePostQuestions ?? true,
      shufflePostOptions: data.shufflePostOptions ?? true,
      timerOverrideMinutes: data.timerOverrideMinutes ?? null,
      partialCredit: data.partialCredit ?? false,
      preOpensAt: data.preOpensAt,
      preClosesAt: data.preClosesAt,
      trainingDate: data.trainingDate,
      postOpensAt: data.postOpensAt,
      postClosesAt: data.postClosesAt,
      status: TrainingStatus.DRAFT,
      enrollments: {
        create: data.enrollUserIds.map((userId) => ({
          userId,
          status: EnrollmentStatus.INVITED,
        })),
      },
    },
  });

  revalidatePath("/admin/training");
  return program.id;
}

type ProgramWithContentTemplate = {
  id: string;
  questionPoolCount: number | null;
  randomizePerParticipant: boolean;
  shufflePostQuestions: boolean;
  shufflePostOptions: boolean;
  enrollments: { id: string; userId: string; status: EnrollmentStatus }[];
  trainingContentTemplate: {
    id: string;
    defaultQuestionCount: number;
    maxQuestions: number;
    questions: Array<{ id: string; sortOrder: number; options: { id: string }[] }>;
  };
};

async function createContentPhaseAttempts(
  program: ProgramWithContentTemplate,
  phase: TrainingAttemptPhase,
  enrollmentFilter: (e: { id: string; userId: string; status: EnrollmentStatus }) => boolean,
): Promise<void> {
  const tpl = program.trainingContentTemplate;
  const qs = tpl.questions;
  for (const e of program.enrollments) {
    if (!enrollmentFilter(e)) continue;
    const existing = await prisma.trainingAttempt.findUnique({
      where: { trainingEnrollmentId_phase: { trainingEnrollmentId: e.id, phase } },
    });
    if (existing) continue;
    const { questionOrder, optionShuffle } = buildRuntimeForAttempt(program, tpl, qs, e.id, phase);
    await prisma.trainingAttempt.create({
      data: {
        trainingProgramId: program.id,
        trainingEnrollmentId: e.id,
        userId: e.userId,
        phase,
        questionOrder,
        optionShuffle: optionShuffle ?? undefined,
      },
    });
  }
}

async function createSelfOnly360(params: {
  organizationId: string;
  templateId: string;
  subjectUserId: string;
  title: string;
  dueAt: Date | null;
  createdByUserId: string;
}) {
  const assessment = await prisma.assessment.create({
    data: {
      organizationId: params.organizationId,
      templateId: params.templateId,
      subjectUserId: params.subjectUserId,
      title: params.title,
      status: AssessmentInstanceStatus.ACTIVE,
      dueAt: params.dueAt,
      createdByUserId: params.createdByUserId,
      evaluators: {
        create: [
          {
            userId: params.subjectUserId,
            role: EvaluatorRole.SELF,
            status: EvaluatorStatus.PENDING,
          },
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
      assessmentTitle: assessment.title ?? "Assessment",
      organizationName: assessment.organization.name,
      evaluatorId: ev.id,
    });
  }

  return assessment.id;
}

export async function launchTrainingPreAssessments(trainingProgramId: string) {
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const program = await prisma.trainingProgram.findFirst({
    where: { id: trainingProgramId, organizationId: orgId },
    include: {
      enrollments: true,
      trainingContentTemplate: {
        include: {
          questions: { include: { options: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!program) throw new Error("Program not found");
  if (program.status !== TrainingStatus.DRAFT && program.status !== TrainingStatus.SCHEDULED) {
    throw new Error("Pre assessments already launched for this program");
  }

  if (program.trainingContentTemplateId && program.trainingContentTemplate) {
    await createContentPhaseAttempts(program as ProgramWithContentTemplate, TrainingAttemptPhase.PRE, () => true);
    await prisma.trainingProgram.update({
      where: { id: program.id },
      data: { status: TrainingStatus.ACTIVE },
    });
    revalidatePath("/admin/training");
    revalidatePath(`/admin/training/${trainingProgramId}`);
    return;
  }

  if (!program.templateId) throw new Error("Program has no assessment template");

  for (const e of program.enrollments) {
    if (e.preAssignmentId) continue;
    const id = await createSelfOnly360({
      organizationId: orgId,
      templateId: program.templateId,
      subjectUserId: e.userId,
      title: `[Pre-training] ${program.name}`,
      dueAt: program.preClosesAt,
      createdByUserId: session.user.id,
    });
    await prisma.trainingEnrollment.update({
      where: { id: e.id },
      data: { preAssignmentId: id },
    });
  }

  await prisma.trainingProgram.update({
    where: { id: program.id },
    data: { status: TrainingStatus.ACTIVE },
  });

  revalidatePath("/admin/training");
  revalidatePath(`/admin/training/${trainingProgramId}`);
}

export async function markCohortTrainingComplete(trainingProgramId: string) {
  const orgId = await requireAdminOrganizationId();
  const program = await prisma.trainingProgram.findFirst({
    where: { id: trainingProgramId, organizationId: orgId },
  });
  if (!program) throw new Error("Program not found");

  await prisma.trainingEnrollment.updateMany({
    where: {
      trainingProgramId,
      status: EnrollmentStatus.PRE_COMPLETED,
    },
    data: { status: EnrollmentStatus.TRAINING_COMPLETED },
  });

  revalidatePath(`/admin/training/${trainingProgramId}`);
}

/** Create post self-assessments for everyone who finished pre (and is not yet on post). */
export async function launchPostAssessments(trainingProgramId: string) {
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const program = await prisma.trainingProgram.findFirst({
    where: { id: trainingProgramId, organizationId: orgId },
    include: {
      enrollments: true,
      trainingContentTemplate: {
        include: {
          questions: { include: { options: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!program) throw new Error("Program not found");

  const now = new Date();
  if (now < program.postOpensAt) {
    throw new Error("Post window is not open yet");
  }

  if (program.trainingContentTemplateId && program.trainingContentTemplate) {
    await createContentPhaseAttempts(program as ProgramWithContentTemplate, TrainingAttemptPhase.POST, (e) => {
      if (e.status === EnrollmentStatus.POST_COMPLETED) return false;
      return e.status === EnrollmentStatus.PRE_COMPLETED || e.status === EnrollmentStatus.TRAINING_COMPLETED;
    });
    revalidatePath(`/admin/training/${trainingProgramId}`);
    return;
  }

  if (!program.templateId) throw new Error("Program has no assessment template");

  for (const e of program.enrollments) {
    if (e.postAssignmentId || !e.preAssignmentId) continue;
    if (e.status === EnrollmentStatus.POST_COMPLETED) continue;
    if (e.status === EnrollmentStatus.INVITED) continue;
    const id = await createSelfOnly360({
      organizationId: orgId,
      templateId: program.templateId,
      subjectUserId: e.userId,
      title: `[Post-training] ${program.name}`,
      dueAt: program.postClosesAt,
      createdByUserId: session.user.id,
    });
    await prisma.trainingEnrollment.update({
      where: { id: e.id },
      data: { postAssignmentId: id },
    });
  }

  revalidatePath(`/admin/training/${trainingProgramId}`);
}

export async function updateTrainingAttendance(trainingProgramId: string, attended: number, expected: number) {
  const orgId = await requireAdminOrganizationId();
  await prisma.trainingProgram.updateMany({
    where: { id: trainingProgramId, organizationId: orgId },
    data: { attendanceCount: attended, attendanceExpected: expected },
  });
  revalidatePath(`/admin/training/${trainingProgramId}`);
}

export async function exportTrainingCsv(trainingProgramId: string): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const program = await prisma.trainingProgram.findFirst({
    where: { id: trainingProgramId, organizationId: orgId },
    include: {
      enrollments: { include: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!program) throw new Error("Not found");

  const lines = [
    "email,name,status,overall_pct_change",
    ...program.enrollments.map((e) => {
      const delta = e.delta as { overall?: { percentChange?: number } } | null;
      const pct = delta?.overall?.percentChange ?? "";
      return [e.user.email ?? "", e.user.name ?? "", e.status, String(pct)].map(csvEscape).join(",");
    }),
  ];
  return lines.join("\n");
}

function csvEscape(s: string) {
  if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function completeTrainingProgram(trainingProgramId: string) {
  const orgId = await requireAdminOrganizationId();
  await prisma.trainingProgram.updateMany({
    where: { id: trainingProgramId, organizationId: orgId },
    data: { status: TrainingStatus.COMPLETED },
  });
  revalidatePath("/admin/training");
  revalidatePath(`/admin/training/${trainingProgramId}`);
}
