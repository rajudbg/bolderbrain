"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { GoalStatus } from "@/generated/prisma/enums";

export async function createDevelopmentGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const member = await prisma.organizationMember.findFirst({ where: { userId: session.user.id } });
  if (!member) throw new Error("No organization");
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const competencyId = formData.get("competencyId") as string | null;
  const targetDateStr = formData.get("targetDate") as string | null;

  if (!title) throw new Error("Title is required");

  await prisma.developmentGoal.create({
    data: {
      userId: session.user.id,
      organizationId: member.organizationId,
      title,
      description: description || null,
      competencyId: competencyId || null,
      targetDate: targetDateStr ? new Date(targetDateStr) : null,
      status: "NOT_STARTED",
    },
  });

  revalidatePath("/app/development");
  return { success: true };
}

export async function updateDevelopmentGoalStatus(id: string, status: GoalStatus) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const goal = await prisma.developmentGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.user.id) {
    throw new Error("Goal not found");
  }

  await prisma.developmentGoal.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/app/development");
  return { success: true };
}
