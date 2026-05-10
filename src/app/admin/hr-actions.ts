"use server";

import {
  AssessmentInstanceStatus,
  EvaluatorStatus,
  OrganizationRole,
} from "@/generated/prisma/enums";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAssessment360 } from "@/app/org/[slug]/assessments/actions";
import { notifyPendingReminder } from "@/lib/email";
import { z } from "zod";

const create360AdminSchema = z.object({
  templateId: z.string().min(1),
  subjectUserId: z.string().min(1),
  title: z.string().min(1).max(200),
  managerUserId: z.string().min(1).nullable().optional(),
  peerUserIds: z.array(z.string().min(1)).default([]),
});

const rosterRoleSchema = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .transform((value) => {
    if (value === "ADMIN") return OrganizationRole.ADMIN;
    if (value === "SUPER_ADMIN") return OrganizationRole.SUPER_ADMIN;
    return OrganizationRole.EMPLOYEE;
  });

const rosterRowSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  role: rosterRoleSchema,
});

function parseRosterCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines[0]?.toLowerCase().startsWith("email,") ? lines.slice(1) : lines;
  return rows.map((line, index) => {
    const [email = "", name = "", department = "", role = ""] = line.split(",").map((cell) => cell.trim());
    const parsed = rosterRowSchema.safeParse({ email, name, department, role });
    if (!parsed.success) {
      throw new Error(`Row ${index + 1}: enter email,name,department,role with a valid email.`);
    }
    return parsed.data;
  });
}

/** Create a behavioral 360 from HR admin routes (uses current admin org cookie). */
export async function createAssessment360Admin(input: z.infer<typeof create360AdminSchema>) {
  const data = create360AdminSchema.parse(input);
  const orgId = await requireAdminOrganizationId();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });
  if (!org) throw new Error("Organization not found");

  const assessmentId = await createAssessment360({
    slug: org.slug,
    templateId: data.templateId,
    subjectUserId: data.subjectUserId,
    title: data.title.trim(),
    managerUserId: data.managerUserId ?? null,
    peerUserIds: data.peerUserIds,
  });
  revalidatePath("/admin/feedback-360");
  revalidatePath("/admin");
  return assessmentId;
}

export async function updateMemberRole(userId: string, role: OrganizationRole) {
  const orgId = await requireAdminOrganizationId();
  await prisma.organizationMember.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role },
  });
  revalidatePath("/admin/people");
}

export async function setUserActive(userId: string, isActive: boolean) {
  await requireAdminOrganizationId();
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/people");
}

export async function updateMemberDepartment(userId: string, department: string | null) {
  const orgId = await requireAdminOrganizationId();
  await prisma.organizationMember.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { department: department?.trim() || null },
  });
  revalidatePath("/admin/people");
  revalidatePath("/admin");
}

export async function importPeopleRoster(csv: string) {
  const orgId = await requireAdminOrganizationId();
  const rows = parseRosterCsv(csv);
  if (rows.length === 0) {
    throw new Error("Paste at least one CSV row.");
  }
  if (rows.length > 200) {
    throw new Error("Import up to 200 rows at a time.");
  }

  let createdUsers = 0;
  let updatedMembers = 0;

  for (const row of rows) {
    const existing = await prisma.user.findUnique({
      where: { email: row.email.toLowerCase() },
      select: { id: true },
    });

    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email: row.email.toLowerCase(),
          name: row.name || null,
          isActive: false,
        },
        select: { id: true },
      }));

    if (!existing) createdUsers += 1;

    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
      create: {
        userId: user.id,
        organizationId: orgId,
        role: row.role,
        department: row.department || null,
      },
      update: {
        role: row.role,
        department: row.department || null,
      },
    });
    updatedMembers += 1;
  }

  revalidatePath("/admin/people");
  return {
    createdUsers,
    updatedMembers,
    message: `Imported ${updatedMembers} roster row(s). ${createdUsers} new user account(s) were created inactive until credentials are provisioned.`,
  };
}

export async function send360Reminder(assessmentId: string) {
  const orgId = await requireAdminOrganizationId();
  const a = await prisma.assessment.findFirst({
    where: { id: assessmentId, organizationId: orgId },
    include: {
      organization: { select: { name: true } },
      template: { select: { name: true } },
      evaluators: {
        where: { status: { in: [EvaluatorStatus.PENDING, EvaluatorStatus.IN_PROGRESS] } },
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });
  if (!a) throw new Error("Assessment not found");

  const title = a.title?.trim() || a.template.name;
  let sent = 0;
  for (const ev of a.evaluators) {
    await notifyPendingReminder({
      to: ev.user.email,
      recipientName: ev.user.name,
      assessmentTitle: title,
      organizationName: a.organization.name,
      evaluatorId: ev.id,
    });
    sent += 1;
  }

  revalidatePath("/admin/feedback-360");
  return {
    ok: true as const,
    message:
      sent === 0
        ? "No pending evaluators — nothing to remind."
        : `Reminder sent to ${sent} evaluator(s) (email when RESEND_API_KEY + EMAIL_FROM are set).`,
  };
}

export async function extend360DueDate(assessmentId: string, extraDays: number) {
  const orgId = await requireAdminOrganizationId();
  const a = await prisma.assessment.findFirstOrThrow({
    where: { id: assessmentId, organizationId: orgId },
  });
  const base = a.dueAt ?? new Date();
  const next = new Date(base.getTime() + extraDays * 86400000);
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { dueAt: next },
  });
  revalidatePath("/admin/feedback-360");
}

export async function cancelAssessment(assessmentId: string) {
  const orgId = await requireAdminOrganizationId();
  await prisma.assessment.updateMany({
    where: { id: assessmentId, organizationId: orgId },
    data: { status: AssessmentInstanceStatus.CANCELLED },
  });
  revalidatePath("/admin/feedback-360");
}
