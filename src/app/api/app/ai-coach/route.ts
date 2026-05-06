import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ai/resilient-generator";

const COACH_SYSTEM_PROMPT = `You are an empathetic AI development coach inside BolderBrain, an HR assessment platform.

Your role:
- Answer questions about the employee's assessment results (360, EQ, IQ, psychometric, development actions)
- Give specific, actionable advice based on their data
- Encourage reflection and growth
- Never reveal raw database IDs or internal system details

Tone: Warm, direct, coaching — like a trusted mentor, not a chatbot.
Format: Keep responses to 2-4 sentences unless the question genuinely needs more detail.
If you don't have specific data for a question, say so honestly and offer what you can.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json() as { message?: string; history?: Array<{ role: string; content: string }> };
  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";

  if (!userMessage) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Gather relevant context about the user
  const [latestInsight, latestEqResult, latestPsychResult, activeActions] = await Promise.all([
    prisma.aIInsight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { finalText: true, assessmentType: true, createdAt: true },
    }),
    prisma.eqTestAttempt.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { submittedAt: "desc" },
      include: { result: { select: { compositeScore: true, highestDomain: true, lowestDomain: true, narrativeText: true } } },
    }),
    prisma.psychTestAttempt.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { submittedAt: "desc" },
      include: { result: { select: { summaryLine: true, teamDynamicsText: true } } },
    }),
    prisma.userAction.findMany({
      where: { userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      include: { action: { include: { competency: { select: { name: true } } } } },
      orderBy: { assignedAt: "desc" },
      take: 5,
    }),
  ]);

  // Build context block
  const contextParts: string[] = [];

  if (latestInsight) {
    contextParts.push(`Latest 360 insight: "${latestInsight.finalText}"`);
  }
  if (latestEqResult?.result) {
    const r = latestEqResult.result;
    contextParts.push(
      `EQ profile: composite ${r.compositeScore.toFixed(0)}/100 — strongest in ${r.highestDomain}, growth area ${r.lowestDomain}. Narrative: "${r.narrativeText}"`,
    );
  }
  if (latestPsychResult?.result) {
    const r = latestPsychResult.result;
    contextParts.push(`Personality summary: "${r.summaryLine}". Team dynamics: "${r.teamDynamicsText}"`);
  }
  if (activeActions.length > 0) {
    const actionList = activeActions
      .map((a) => `${a.action.competency.name} — ${a.action.title}`)
      .join("; ");
    contextParts.push(`Active development actions: ${actionList}`);
  }

  const contextBlock =
    contextParts.length > 0
      ? `\n\nEmployee context:\n${contextParts.join("\n")}`
      : "\n\nNo assessment data available yet for this employee.";

  // Build conversation history prompt
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const historyText = history
    .map((m) => `${m.role === "user" ? "Employee" : "Coach"}: ${m.content}`)
    .join("\n");

  const prompt = `${historyText ? historyText + "\n" : ""}Employee: ${userMessage}${contextBlock}

Coach:`;

  const fallback = () =>
    "I'm here to help with your development journey. I don't have specific data available right now, but feel free to ask about your goals, how to interpret your assessment results, or what to focus on this week.";

  const result = await generateWithFallback(prompt, COACH_SYSTEM_PROMPT, fallback, undefined, 300);

  return NextResponse.json({
    reply: result.success && result.content.trim().length > 10 ? result.content : fallback(),
    source: result.source,
  });
}
