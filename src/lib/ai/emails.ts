import { generateCacheKey } from "./cache";
import { generateWithFallback } from "./resilient-generator";

const EMAIL_SYSTEM_PROMPT = `You are an HR communications specialist writing reminder emails.

Tone guidelines by urgency:
- HIGH (1-2 days): Direct, clear deadline, consequence-aware but not threatening
- MEDIUM (3-7 days): Helpful, benefit-focused, deadline clear
- LOW (8+ days): Friendly, flexible, value-focused

Format: Subject line (5-7 words) | Body (2-3 sentences max)

Example HIGH:
"Complete by Friday: Communication Skills Assessment | Your pre-training assessment closes in 2 days. This baseline helps us measure your growth after the workshop. [Start Assessment]"

Example LOW:
"Your Assessment is Ready When You Are | The Strategic Thinking baseline is open through next Friday. Takes 15 minutes and helps shape your development plan."`;

export async function generateReminderEmail(context: {
  recipientName: string;
  programName: string;
  assessmentType: "pre" | "post";
  daysRemaining: number;
  deadline: Date;
}) {
  const urgency =
    context.daysRemaining <= 2 ? "HIGH" : context.daysRemaining <= 7 ? "MEDIUM" : "LOW";

  const cacheKey = generateCacheKey({
    ...context,
    deadline: context.deadline.toISOString(),
    type: "email",
  });

  const prompt = `Write a ${urgency} urgency reminder email.

To: ${context.recipientName}
Program: ${context.programName}
Assessment: ${context.assessmentType}-training
Due: ${context.deadline.toDateString()}
Days left: ${context.daysRemaining}

Subject line and 2-3 sentence body.`;

  const fallback = () => {
    const subject =
      context.daysRemaining <= 2
        ? `URGENT: ${context.programName} assessment due in ${context.daysRemaining} days`
        : `Reminder: ${context.programName} assessment open`;
    const body = `Hi ${context.recipientName}, your ${context.assessmentType}-training assessment for ${context.programName} is due ${context.deadline.toDateString()}. Please complete it when convenient.`;
    return `${subject} | ${body}`;
  };

  const result = await generateWithFallback(prompt, EMAIL_SYSTEM_PROMPT, fallback, cacheKey, 200);

  const combined =
    result.success && result.content.trim().length > 0 ? result.content : fallback();

  const firstSep = combined.indexOf(" | ");
  const subject = firstSep >= 0 ? combined.slice(0, firstSep).trim() : "Assessment Reminder";
  const body = firstSep >= 0 ? combined.slice(firstSep + 3).trim() : combined;

  return {
    subject,
    body,
    source: result.source,
  };
}
