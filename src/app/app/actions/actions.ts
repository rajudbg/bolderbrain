"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { maybeUpdateStreakAfterUserActionChange } from "@/lib/action-engine";
import { UserActionStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { z } from "zod";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function completeMyUserAction(userActionId: string, reflection?: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." } satisfies ActionResult;

  const ua = await prisma.userAction.findFirst({
    where: { id: userActionId, userId: session.user.id },
  });
  if (!ua) return { ok: false, error: "Action not found." } satisfies ActionResult;
  if (ua.status === UserActionStatus.COMPLETED) return { ok: true } satisfies ActionResult;
  if (ua.status === UserActionStatus.DISMISSED) {
    return { ok: false, error: "Action was dismissed." } satisfies ActionResult;
  }

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
  return { ok: true } satisfies ActionResult;
}

export async function dismissMyUserAction(input: { userActionId: string; reason: string }) {
  const parsed = z
    .object({
      userActionId: z.string().min(1),
      reason: z.string().min(1).max(2000),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Add a short reason before dismissing." } satisfies ActionResult;
  }
  const data = parsed.data;

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." } satisfies ActionResult;

  const ua = await prisma.userAction.findFirst({
    where: { id: data.userActionId, userId: session.user.id },
  });
  if (!ua) return { ok: false, error: "Action not found." } satisfies ActionResult;
  if (ua.status === UserActionStatus.COMPLETED || ua.status === UserActionStatus.DISMISSED) {
    return { ok: true } satisfies ActionResult;
  }

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
  return { ok: true } satisfies ActionResult;
}

export async function startMyUserAction(userActionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." } satisfies ActionResult;

  const ua = await prisma.userAction.findFirst({
    where: { id: userActionId, userId: session.user.id },
  });
  if (!ua) return { ok: false, error: "Action not found." } satisfies ActionResult;
  if (ua.status !== UserActionStatus.ASSIGNED) return { ok: true } satisfies ActionResult;

  await prisma.userAction.update({
    where: { id: userActionId },
    data: { status: UserActionStatus.IN_PROGRESS },
  });

  revalidatePath("/app");
  revalidatePath("/app/actions");
  return { ok: true } satisfies ActionResult;
}
