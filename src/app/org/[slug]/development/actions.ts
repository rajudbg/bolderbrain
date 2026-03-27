"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { UserActionSource, UserActionStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { maybeUpdateStreakAfterUserActionChange } from "@/lib/action-engine";
import { getIsoWeekKey } from "@/lib/iso-week";
import { requireOrgAdmin } from "@/lib/org-auth";
import { z } from "zod";

export async function listOrgMembersForDevelopment(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.organizationMember.findMany({
    where: { organizationId: tenant.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { email: "asc" } },
  });
}

export async function listOrgActionsForManualAssign(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.action.findMany({
    where: {
      isActive: true,
      competency: { organizationId: tenant.organizationId, isActive: true },
    },
    include: {
      competency: { select: { name: true, key: true } },
    },
    orderBy: [{ competency: { sortOrder: "asc" } }, { sortOrder: "asc" }, { title: "asc" }],
  });
}

export async function listOrgUserActionsForAdmin(slug: string) {
  const { tenant } = await requireOrgAdmin(slug);
  return prisma.userAction.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { assignedAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      action: { select: { title: true } },
    },
  });
}

const assignSchema = z.object({
  slug: z.string().min(1),
  targetUserId: z.string().min(1),
  actionId: z.string().min(1),
});

export async function orgManualAssignAction(input: z.infer<typeof assignSchema>) {
  const data = assignSchema.parse(input);
  const { tenant } = await requireOrgAdmin(data.slug);

  const action = await prisma.action.findFirst({
    where: {
      id: data.actionId,
      isActive: true,
      competency: { organizationId: tenant.organizationId },
    },
  });
  if (!action) throw new Error("Action not found");

  const member = await prisma.organizationMember.findFirst({
    where: { organizationId: tenant.organizationId, userId: data.targetUserId },
  });
  if (!member) throw new Error("User is not a member of this organization");

  const weekKey = getIsoWeekKey();
  try {
    await prisma.userAction.create({
      data: {
        userId: data.targetUserId,
        actionId: action.id,
        organizationId: tenant.organizationId,
        weekKey,
        status: UserActionStatus.ASSIGNED,
        source: UserActionSource.MANUAL,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("That action is already assigned to this person for this week");
    }
    throw e;
  }

  revalidatePath(`/org/${data.slug}/development`);
  revalidatePath("/app");
  revalidatePath("/app/actions");
}

const dismissSchema = z.object({
  slug: z.string().min(1),
  userActionId: z.string().min(1),
  reason: z.string().min(1).max(2000),
});

export async function orgDismissUserAction(input: z.infer<typeof dismissSchema>) {
  const data = dismissSchema.parse(input);
  const { tenant } = await requireOrgAdmin(data.slug);

  const ua = await prisma.userAction.findFirst({
    where: {
      id: data.userActionId,
      organizationId: tenant.organizationId,
    },
  });
  if (!ua) throw new Error("Not found");

  await prisma.userAction.update({
    where: { id: ua.id },
    data: {
      status: UserActionStatus.DISMISSED,
      dismissReason: data.reason.trim(),
      completedAt: new Date(),
    },
  });

  await maybeUpdateStreakAfterUserActionChange(ua.userId, ua.weekKey);

  revalidatePath(`/org/${data.slug}/development`);
  revalidatePath("/app");
  revalidatePath("/app/actions");
}
