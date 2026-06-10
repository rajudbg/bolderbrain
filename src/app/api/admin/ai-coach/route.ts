// @ts-nocheck
/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { generateWithFallback } from "@/lib/ai/resilient-generator";
import prisma from "@/lib/prisma";
import { getAdminOverviewKpis, getAdminAlerts } from "@/lib/admin/queries";

const ADMIN_COACH_SYSTEM_PROMPT = `You are an analytical HR Intelligence AI inside BolderBrain.

Your role:
- Answer questions about workforce data, assessment trends, and organizational risks
- Give specific, actionable advice based on live organization data
- Help HR admins identify bottlenecks, high-potential employees, and skill gaps
- Never reveal raw database IDs or internal system details
- Maintain a professional, analytical, and helpful tone
- Format responses concisely (2-4 sentences) unless a detailed explanation is requested
`;

export async function GET() {
  const orgId = await requireAdminOrganizationId().catch(() => null);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    storageKey: `bb-admin-coach:${orgId}`,
    welcome: "Hi. I am analyzing your organization's latest assessment and performance data. Ask me to summarize completion rates, identify risks, or find bottlenecks.",
    starterPrompts: [
      "Summarize our latest completion rates",
      "Who are the top talent risks?",
      "What are our largest skill gaps?",
      "Which departments need attention?"
    ],
    workflowActions: [
      { id: "dashboard", label: "View Dashboard", href: "/admin", reason: "Check your live KPIs" },
      { id: "people", label: "Manage People", href: "/admin/people", reason: "Review employee details" },
      { id: "talent", label: "Talent Review", href: "/admin/talent", reason: "See 9-box and succession" }
    ],
  });
}

export async function POST(req: NextRequest) {
  const orgId = await requireAdminOrganizationId().catch(() => null);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!userMessage) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const now = new Date();
  const range = { from: new Date(now.getTime() - 90 * 86400000), to: now };
  const prevRange = { from: new Date(now.getTime() - 180 * 86400000), to: range.from };

  const [kpis, alerts] = await Promise.all([
    getAdminOverviewKpis(orgId, range, prevRange),
    getAdminAlerts(orgId)
  ]);

  const contextBlock = `Organization Data:
Employees: ${kpis.totalEmployees}
Active Assessments: ${kpis.activeAssessments}
Completion Rate: ${kpis.completionRatePct}%
Average Competency Score: ${kpis.avgCompetencyScore}
Alerts: ${alerts.pendingEvaluations} pending evaluations, ${alerts.overdue360} overdue 360s, ${alerts.stalled360} stalled 360s.`;

  const historyText = Array.isArray(body.history)
    ? body.history.map((m: any) => `${m.role === "user" ? "Admin" : "AI"}: ${m.content}`).join("\n")
    : "";

  const prompt = `Context:
${contextBlock}

${historyText ? historyText + "\n" : ""}Admin: ${userMessage}

AI:`;

  const fallback = () => "I'm currently unable to generate a deep analysis, but based on your data, you should check the Dashboard for your live completion rates.";
  const result = await generateWithFallback(prompt, ADMIN_COACH_SYSTEM_PROMPT, fallback, undefined, 300);

  return NextResponse.json({
    reply: result.success && result.content.trim().length > 10 ? result.content : fallback(),
    source: result.source,
  });
}
