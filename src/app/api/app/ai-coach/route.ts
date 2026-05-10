import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { EnrollmentStatus, OrgAssessmentAssignmentStatus } from "@/generated/prisma/enums";
import { generateWithFallback } from "@/lib/ai/resilient-generator";
import prisma from "@/lib/prisma";
import type { TenantClaim } from "@/types/tenant";

const COACH_SYSTEM_PROMPT = `You are an empathetic AI development coach inside BolderBrain, an HR assessment platform.

Your role:
- Answer questions about the employee's assessment results (360, EQ, IQ, psychometric, development actions)
- Give specific, actionable advice based on their live data
- Prioritize the employee's most important next step when they already have open work
- Encourage reflection and growth
- Never reveal raw database IDs or internal system details

Tone: Warm, direct, coaching — like a trusted mentor, not a chatbot.
Format: Keep responses to 2-4 sentences unless the question genuinely needs more detail.
If you do not have specific data for a question, say so honestly and offer what you can.`;

type CoachHistoryMessage = {
  role: string;
  content: string;
};

type CoachWorkflowAction = {
  id: string;
  label: string;
  href: string;
  reason: string;
};

type SmartActionHint = {
  title: string;
  description: string;
  resource: string;
};

type CoachContext = {
  storageKey: string;
  welcome: string;
  starterPrompts: string[];
  workflowActions: CoachWorkflowAction[];
  contextBlock: string;
};

const DEFAULT_STARTER_PROMPTS = [
  "What should I focus on this week?",
  "Explain my latest results in plain English",
  "Help me choose a development action",
  "What should I complete first?",
];

async function resolveCoachMember(userId: string, tenants: TenantClaim[] | undefined) {
  const preferredOrgId = tenants?.[0]?.organizationId;

  if (preferredOrgId) {
    const member = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: preferredOrgId },
      include: { organization: { select: { name: true } } },
    });
    if (member) return member;
  }

  return prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function latestOrgInsight(userId: string, organizationId: string) {
  const recentInsights = await prisma.aIInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      assessmentId: true,
      finalText: true,
      assessmentType: true,
      createdAt: true,
      smartActionsJson: true,
    },
    take: 10,
  });

  for (const insight of recentInsights) {
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: insight.assessmentId,
        organizationId,
        subjectUserId: userId,
      },
      select: { id: true },
    });
    if (assessment) return insight;
  }

  return null;
}

function toSmartActions(value: unknown): SmartActionHint[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      title: typeof item.title === "string" ? item.title.trim() : "",
      description: typeof item.description === "string" ? item.description.trim() : "",
      resource: typeof item.resource === "string" ? item.resource.trim() : "",
    }))
    .filter((item) => item.title.length > 0);
}

function buildCoachWorkflowActions(input: {
  pendingTaskCount: number;
  activeActions: Array<{ action: { title: string; competency: { name: string } } }>;
  openTraining: Array<{ trainingProgram: { name: string } }>;
  topGaps: Array<{ competency: { name: string }; gap: number }>;
  smartActions: SmartActionHint[];
}): CoachWorkflowAction[] {
  const actions: CoachWorkflowAction[] = [];

  if (input.pendingTaskCount > 0) {
    actions.push({
      id: "assessments",
      label:
        input.pendingTaskCount === 1
          ? "Complete your open assessment"
          : `Complete ${input.pendingTaskCount} open assessments`,
      href: "/assessments",
      reason: "Clear active assessment work first so the rest of your coaching stays current.",
    });
  }

  if (input.activeActions.length > 0) {
    const topAction = input.activeActions[0]?.action;
    actions.push({
      id: "actions",
      label:
        input.activeActions.length === 1
          ? "Review your active action"
          : `Review ${input.activeActions.length} active actions`,
      href: "/app/actions",
      reason: topAction
        ? `${topAction.competency.name} is already in progress through \"${topAction.title}\".`
        : "You already have active development work underway.",
    });
  }

  if (input.openTraining.length > 0) {
    actions.push({
      id: "training",
      label: "Continue my learning",
      href: "/app/training",
      reason: `${input.openTraining[0]?.trainingProgram.name ?? "Your current program"} still has open learning steps.`,
    });
  }

  if (input.topGaps.length > 0) {
    const topGap = input.topGaps[0]!;
    actions.push({
      id: "development",
      label: "Open my skills hub",
      href: "/app/development",
      reason: `${topGap.competency.name} is your largest target gap right now (${topGap.gap.toFixed(1)}).`,
    });
  }

  if (input.smartActions.length > 0) {
    actions.push({
      id: "recommendations",
      label: "See recommended next steps",
      href: "/app/recommendations",
      reason: input.smartActions[0]?.title ?? "You already have AI-generated next steps ready.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "dashboard",
      label: "Open my dashboard",
      href: "/app/dashboard",
      reason: "Start from your latest results and activity summary.",
    });
  }

  return actions.slice(0, 3);
}

function buildStarterPrompts(input: {
  latestInsightText: string | null;
  latestEqGrowthArea: string | null;
  latestPsychSummary: string | null;
  pendingTaskCount: number;
  topGaps: Array<{ competency: { name: string } }>;
}): string[] {
  const prompts = [
    input.pendingTaskCount > 0 ? "What should I complete first this week?" : null,
    input.latestInsightText ? "Turn my latest 360 into a weekly plan" : null,
    input.latestEqGrowthArea ? `How do I improve ${input.latestEqGrowthArea}?` : null,
    input.latestPsychSummary ? "How should I use my personality strengths at work?" : null,
    input.topGaps[0] ? `Build me a plan for ${input.topGaps[0].competency.name}` : null,
    "What should I focus on this week?",
    "Explain my latest results in plain English",
  ].filter((prompt): prompt is string => Boolean(prompt));

  return [...new Set(prompts)].slice(0, 4);
}

function buildWelcomeMessage(input: {
  userName: string | null;
  organizationName: string | null;
  department: string | null;
  pendingTaskCount: number;
  activeActionCount: number;
  openTrainingCount: number;
  topGapName: string | null;
  latestInsightText: string | null;
}): string {
  const intro = input.userName ? `Hi ${input.userName.split(" ")[0]}.` : "Hi.";
  const scope = input.organizationName
    ? `I can already see your current BolderBrain data from ${input.organizationName}${input.department ? ` (${input.department})` : ""}.`
    : "I can already see your current BolderBrain data.";

  const signals: string[] = [];
  if (input.pendingTaskCount > 0) {
    signals.push(
      input.pendingTaskCount === 1
        ? "you have 1 open assessment task"
        : `you have ${input.pendingTaskCount} open assessment tasks`,
    );
  }
  if (input.activeActionCount > 0) {
    signals.push(
      input.activeActionCount === 1
        ? "1 active development action is already underway"
        : `${input.activeActionCount} active development actions are already underway`,
    );
  }
  if (input.openTrainingCount > 0) {
    signals.push(
      input.openTrainingCount === 1
        ? "you are enrolled in 1 learning program"
        : `you are enrolled in ${input.openTrainingCount} learning programs`,
    );
  }
  if (input.topGapName) {
    signals.push(`${input.topGapName} is your biggest current target gap`);
  }

  const signalLine =
    signals.length > 0
      ? `Right now, ${signals.join(", ")}.`
      : "Ask me to prioritize your next step, explain a result, or turn feedback into a plan.";
  const insightLine = input.latestInsightText ? `Latest 360 insight: \"${input.latestInsightText}\"` : "";

  return [intro, scope, signalLine, insightLine].filter(Boolean).join(" ");
}

async function loadCoachContext(
  userId: string,
  userName: string | null,
  tenants: TenantClaim[] | undefined,
): Promise<CoachContext> {
  const member = await resolveCoachMember(userId, tenants);
  if (!member) {
    const workflowActions = buildCoachWorkflowActions({
      pendingTaskCount: 0,
      activeActions: [],
      openTraining: [],
      topGaps: [],
      smartActions: [],
    });
    return {
      storageKey: `bb-ai-coach:${userId}:no-org`,
      welcome:
        "Hi. I cannot see an organization workspace for your account yet, so I can only offer general development guidance for now.",
      starterPrompts: DEFAULT_STARTER_PROMPTS,
      workflowActions,
      contextBlock: `Employee: ${userName ?? "Unknown user"}\nOrganization: unavailable`,
    };
  }

  const organizationId = member.organizationId;
  const [latestInsight, latestEqResult, latestPsychResult, activeActions, pendingRaterTasks, pendingOrgAssignments, openTraining, topGaps] =
    await Promise.all([
      latestOrgInsight(userId, organizationId),
      prisma.eqTestAttempt.findFirst({
        where: { userId, organizationId, status: "COMPLETED" },
        orderBy: { submittedAt: "desc" },
        include: {
          result: {
            select: {
              compositeScore: true,
              highestDomain: true,
              lowestDomain: true,
              narrativeText: true,
            },
          },
        },
      }),
      prisma.psychTestAttempt.findFirst({
        where: { userId, organizationId, status: "COMPLETED" },
        orderBy: { submittedAt: "desc" },
        include: {
          result: {
            select: {
              summaryLine: true,
              teamDynamicsText: true,
            },
          },
        },
      }),
      prisma.userAction.findMany({
        where: { userId, organizationId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        include: { action: { include: { competency: { select: { name: true } } } } },
        orderBy: { assignedAt: "desc" },
        take: 5,
      }),
      prisma.assessmentEvaluator.count({
        where: {
          userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          assessment: { organizationId },
        },
      }),
      prisma.orgAssessmentAssignment.count({
        where: {
          assignedUserId: userId,
          organizationId,
          status: { in: [OrgAssessmentAssignmentStatus.PENDING, OrgAssessmentAssignmentStatus.IN_PROGRESS] },
        },
      }),
      prisma.trainingEnrollment.findMany({
        where: {
          userId,
          status: { not: EnrollmentStatus.POST_COMPLETED },
          trainingProgram: { organizationId },
        },
        include: {
          trainingProgram: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { trainingProgram: { trainingDate: "asc" } },
        take: 3,
      }),
      prisma.skillsInventory.findMany({
        where: { userId, organizationId, gap: { gt: 0 } },
        include: { competency: { select: { name: true } } },
        orderBy: [{ gap: "desc" }],
        take: 3,
      }),
    ]);

  const smartActions = toSmartActions(latestInsight?.smartActionsJson);
  const pendingTaskCount = pendingRaterTasks + pendingOrgAssignments;
  const workflowActions = buildCoachWorkflowActions({
    pendingTaskCount,
    activeActions,
    openTraining,
    topGaps,
    smartActions,
  });

  const contextParts: string[] = [];
  contextParts.push(`Employee: ${userName ?? "Unknown user"}`);
  if (member) {
    contextParts.push(
      `Organization: ${member.organization.name}${member.department ? ` | Department: ${member.department}` : ""} | Role: ${member.role}`,
    );
  }
  contextParts.push(`Open assessment tasks: ${pendingTaskCount}`);
  if (latestInsight?.finalText) {
    contextParts.push(`Latest 360 insight: \"${latestInsight.finalText}\"`);
  }
  if (latestEqResult?.result) {
    const result = latestEqResult.result;
    contextParts.push(
      `EQ profile: composite ${result.compositeScore.toFixed(0)}/100 | strongest ${result.highestDomain} | growth area ${result.lowestDomain} | narrative \"${result.narrativeText}\"`,
    );
  }
  if (latestPsychResult?.result) {
    const result = latestPsychResult.result;
    contextParts.push(`Personality summary: \"${result.summaryLine}\" | team dynamics: \"${result.teamDynamicsText}\"`);
  }
  if (topGaps.length > 0) {
    contextParts.push(
      `Top target gaps: ${topGaps.map((gap) => `${gap.competency.name} (${gap.gap.toFixed(1)})`).join("; ")}`,
    );
  }
  if (activeActions.length > 0) {
    contextParts.push(
      `Active development actions: ${activeActions
        .map((action) => `${action.action.competency.name} — ${action.action.title}`)
        .join("; ")}`,
    );
  }
  if (smartActions.length > 0) {
    contextParts.push(
      `AI smart actions already suggested: ${smartActions
        .map((action) => `${action.title}${action.resource ? ` [${action.resource}]` : ""}`)
        .join("; ")}`,
    );
  }
  if (openTraining.length > 0) {
    contextParts.push(
      `Open learning programs: ${openTraining.map((enrollment) => enrollment.trainingProgram.name).join("; ")}`,
    );
  }
  contextParts.push(
    `Workflow actions available in-product: ${workflowActions.map((action) => `${action.label} -> ${action.href}`).join("; ")}`,
  );

  return {
    storageKey: `bb-ai-coach:${userId}:${organizationId}`,
    welcome: buildWelcomeMessage({
      userName,
      organizationName: member?.organization.name ?? null,
      department: member?.department ?? null,
      pendingTaskCount,
      activeActionCount: activeActions.length,
      openTrainingCount: openTraining.length,
      topGapName: topGaps[0]?.competency.name ?? null,
      latestInsightText: latestInsight?.finalText ?? null,
    }),
    starterPrompts: buildStarterPrompts({
      latestInsightText: latestInsight?.finalText ?? null,
      latestEqGrowthArea: latestEqResult?.result?.lowestDomain ?? null,
      latestPsychSummary: latestPsychResult?.result?.summaryLine ?? null,
      pendingTaskCount,
      topGaps,
    }),
    workflowActions,
    contextBlock: contextParts.join("\n"),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await loadCoachContext(session.user.id, session.user.name ?? null, session.user.tenants);
  return NextResponse.json({
    storageKey: context.storageKey,
    welcome: context.welcome,
    starterPrompts: context.starterPrompts,
    workflowActions: context.workflowActions,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { message?: string; history?: CoachHistoryMessage[] };
  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!userMessage) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // 10 requests per minute max for AI Coach
  const { checkRateLimit } = await import("@/lib/api-rate-limit");
  if (!checkRateLimit(`ai-coach:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }


  const context = await loadCoachContext(session.user.id, session.user.name ?? null, session.user.tenants);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const historyText = history
    .map((message) => `${message.role === "user" ? "Employee" : "Coach"}: ${message.content}`)
    .join("\n");

  const prompt = `Employee context:
${context.contextBlock}

${historyText ? historyText + "\n" : ""}Employee: ${userMessage}

Coach:`;

  const fallback = () =>
    `AI coaching is running in fallback mode right now, so this is a rule-based suggestion from your current BolderBrain context. ${context.welcome} Start with one of the in-product next steps shown here.`;
  const result = await generateWithFallback(prompt, COACH_SYSTEM_PROMPT, fallback, undefined, 300);

  return NextResponse.json({
    reply: result.success && result.content.trim().length > 10 ? result.content : fallback(),
    source: result.source,
    workflowActions: context.workflowActions,
  });
}
