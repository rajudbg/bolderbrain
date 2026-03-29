import { EnrollmentStatus, TrainingStatus } from "@/generated/prisma/enums";
import { generateReminderEmail } from "@/lib/ai/emails";
import { trySetDedupeKey } from "@/lib/ai/cache";
import { notifyTrainingProgramReminderAi } from "@/lib/email";
import prisma from "@/lib/prisma";

/**
 * Sends AI-enhanced (or rule-based) training reminders for enrollments due within 48 hours.
 * Intended to run from `/api/cron/training-reminders` on a schedule (hourly).
 */
export async function runTrainingReminderCron(): Promise<{ sent: number }> {
  let sent = 0;
  const now = Date.now();
  const windowEnd = now + 48 * 60 * 60 * 1000;

  const programs = await prisma.trainingProgram.findMany({
    where: { status: { in: [TrainingStatus.ACTIVE, TrainingStatus.SCHEDULED] } },
    include: {
      organization: { select: { name: true } },
      enrollments: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  for (const p of programs) {
    for (const e of p.enrollments) {
      if (e.status === EnrollmentStatus.POST_COMPLETED) continue;

      let deadline: Date | null = null;
      let assessmentType: "pre" | "post" = "pre";

      if (e.status === EnrollmentStatus.INVITED) {
        deadline = p.preClosesAt;
        assessmentType = "pre";
      } else if (
        e.status === EnrollmentStatus.PRE_COMPLETED ||
        e.status === EnrollmentStatus.TRAINING_COMPLETED
      ) {
        if (now < p.postOpensAt.getTime()) continue;
        deadline = p.postClosesAt;
        assessmentType = "post";
      } else {
        continue;
      }

      const d = deadline.getTime();
      if (d <= now || d > windowEnd) continue;

      const daysRemaining = Math.max(1, Math.ceil((d - now) / (24 * 60 * 60 * 1000)));

      const dedupeKey = `reminder:${e.id}:${p.id}:${assessmentType}:${deadline.toISOString().slice(0, 10)}`;
      const allow = await trySetDedupeKey(dedupeKey, 86_400);
      if (!allow) continue;

      const email = await generateReminderEmail({
        recipientName: e.user.name ?? "there",
        programName: p.name,
        assessmentType,
        daysRemaining,
        deadline,
      });

      await notifyTrainingProgramReminderAi({
        to: e.user.email,
        recipientName: e.user.name,
        organizationName: p.organization.name,
        programName: p.name,
        subject: email.subject,
        body: email.body,
      });
      sent += 1;
    }
  }

  return { sent };
}
