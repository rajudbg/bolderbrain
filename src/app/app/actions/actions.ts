"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { maybeUpdateStreakAfterUserActionChange } from "@/lib/action-engine";
import { UserActionStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function completeMyUserAction(userActionId: string, reflection?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ua = await prisma.userAction.findFirst({
    where: { id: userActionId, userId: session.user.id },
  });
  if (!ua) throw new Error("Not found");
  if (ua.status === UserActionStatus.COMPLETED) return;
  if (ua.status === UserActionStatus.DISMISSED) throw new Error("Action was dismissed");

  await prisma.userAction.update({
    where: { id: userActionId },
    data: {
      status: UserActionStatus.COMPLETED,
      completedAt: new Date(),
      notes: reflection?.trim() || null,
    },
  });

  await maybeUpdateStreakAfterUserActionChange(session.user.id, ua.weekKey);

  revalidatePath("/app");
  revalidatePath("/app/actions");
}

export async function dismissMyUserAction(input: { userActionId: string; reason: string }) {
  const data = z
    .object({
      userActionId: z.string().min(1),
      reason: z.string().min(1).max(2000),
    })
    .parse(input);

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ua = await prisma.userAction.findFirst({
    where: { id: data.userActionId, userId: session.user.id },
  });
  if (!ua) throw new Error("Not found");
  if (ua.status === UserActionStatus.COMPLETED || ua.status === UserActionStatus.DISMISSED) return;

  await prisma.userAction.update({
    where: { id: data.userActionId },
    data: {
      status: UserActionStatus.DISMISSED,
      dismissReason: data.reason.trim(),
      completedAt: new Date(),
    },
  });

  await maybeUpdateStreakAfterUserActionChange(session.user.id, ua.weekKey);

  revalidatePath("/app");
  revalidatePath("/app/actions");
}

export async function startMyUserAction(userActionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ua = await prisma.userAction.findFirst({
    where: { id: userActionId, userId: session.user.id },
  });
  if (!ua) throw new Error("Not found");
  if (ua.status !== UserActionStatus.ASSIGNED) return;

  await prisma.userAction.update({
    where: { id: userActionId },
    data: { status: UserActionStatus.IN_PROGRESS },
  });

  revalidatePath("/app");
  revalidatePath("/app/actions");
}
