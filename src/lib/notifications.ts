import { NotificationType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
};

/** Create a notification, silently swallowing errors so it never blocks critical paths. */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.userNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  } catch {
    // Non-critical — never block the caller
  }
}

/** Get unread + non-dismissed notifications for a user (most recent first, capped at 50). */
export async function getUnreadNotifications(userId: string) {
  return prisma.userNotification.findMany({
    where: { userId, isDismissed: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      isRead: true,
      createdAt: true,
    },
  });
}

/** Mark all unread as read for a user. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/** Dismiss a single notification. */
export async function dismissNotification(userId: string, notificationId: string): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { id: notificationId, userId },
    data: { isDismissed: true },
  });
}
