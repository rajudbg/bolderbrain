import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getIsoWeekKey } from "@/lib/iso-week";

export async function getEmployeeActionsPagePayload() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const weekKey = getIsoWeekKey();

  const [thisWeek, history, streak] = await Promise.all([
    prisma.userAction.findMany({
      where: { userId, weekKey },
      include: {
        action: {
          include: {
            competency: { select: { key: true, name: true } },
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    }),
    prisma.userAction.findMany({
      where: { userId, weekKey: { not: weekKey } },
      include: {
        action: {
          include: {
            competency: { select: { key: true, name: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
      take: 40,
    }),
    prisma.userDevelopmentStreak.findUnique({ where: { userId } }),
  ]);

  return {
    weekKey,
    thisWeek: thisWeek.map((ua) => ({
      id: ua.id,
      title: ua.action.title,
      description: ua.action.description,
      difficulty: ua.action.difficulty,
      estimatedTime: ua.action.estimatedTime,
      competencyName: ua.action.competency.name,
      competencyKey: ua.action.competency.key,
      status: ua.status,
      assignedAt: ua.assignedAt.toISOString(),
    })),
    history: history.map((ua) => ({
      id: ua.id,
      title: ua.action.title,
      description: ua.action.description,
      difficulty: ua.action.difficulty,
      estimatedTime: ua.action.estimatedTime,
      competencyName: ua.action.competency.name,
      status: ua.status,
      weekKey: ua.weekKey,
      assignedAt: ua.assignedAt.toISOString(),
    })),
    streak: streak?.consecutiveWeeksCompleted ?? 0,
  };
}
