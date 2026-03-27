/**
 * Optional email delivery. Set RESEND_API_KEY + EMAIL_FROM for production;
 * otherwise logs to the server console (useful in development).
 */

function appOrigin(): string {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/^(?!http)/, "https://") ||
    "http://localhost:3000"
  );
}

export function buildAssessmentTakeUrl(evaluatorId: string): string {
  return `${appOrigin()}/assessments/${evaluatorId}`;
}

export async function notifyEvaluatorAssigned(input: {
  to: string | null | undefined;
  recipientName: string | null;
  assessmentTitle: string;
  organizationName: string;
  evaluatorId: string;
}): Promise<void> {
  const to = input.to?.trim();
  if (!to) return;

  const takeUrl = buildAssessmentTakeUrl(input.evaluatorId);
  const subject = `360 assessment: ${input.assessmentTitle}`;
  const text = [
    `Hello ${input.recipientName ?? "there"},`,
    ``,
    `You've been asked to complete a 360 assessment for ${input.organizationName}: "${input.assessmentTitle}".`,
    ``,
    `Open your assessment: ${takeUrl}`,
    ``,
    `If you did not expect this message, you can ignore it.`,
  ].join("\n");

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        console.error("[email] Resend error", res.status, await res.text());
      }
    } catch (e) {
      console.error("[email] Resend failed", e);
    }
    return;
  }

  console.log("[email stub]", { to, subject, text });
}

export async function notifyPendingReminder(input: {
  to: string | null | undefined;
  recipientName: string | null;
  assessmentTitle: string;
  organizationName: string;
  evaluatorId: string;
}): Promise<void> {
  await notifyEvaluatorAssigned({
    ...input,
    recipientName: input.recipientName,
  });
}
