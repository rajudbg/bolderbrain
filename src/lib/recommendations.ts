import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AssessmentTemplateType } from "@/generated/prisma/enums";

export type TrainingRecommendation = {
  id: string;
  type: "competency_gap" | "development_area" | "skill_building";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  competencyKey: string | null;
  competencyName: string | null;
  estimatedTimeMinutes: number;
  source: "360_gap" | "eq_insight" | "manager_suggested" | "system";
  matchedGap: number | null; // Self vs Others gap that triggered this
  actionId: string | null; // Link to existing action if available
};

export type RecommendationsPayload = {
  totalRecommendations: number;
  highPriorityCount: number;
  byCategory: {
    competencyGaps: TrainingRecommendation[];
    developmentAreas: TrainingRecommendation[];
    skillBuilding: TrainingRecommendation[];
  };
};

export async function getRecommendationsForUser(): Promise<RecommendationsPayload | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Get latest 360 scores to identify gaps
  const latestResult = await prisma.assessmentResult.findFirst({
    where: {
      assessment: {
        subjectUserId: userId,
        template: { type: AssessmentTemplateType.BEHAVIORAL_360 },
      },
    },
    orderBy: { computedAt: "desc" },
    include: {
      assessment: {
        include: {
          organization: { select: { id: true } },
        },
      },
    },
  });

  const recommendations: TrainingRecommendation[] = [];

  if (latestResult?.competencyScores) {
    const scores = latestResult.competencyScores as {
      byCompetency: Array<{
        competencyKey: string;
        self: number;
        peerAvg: number;
        manager: number;
        gapSelfVsOthers: number;
      }>;
    };

    // Find competencies with significant gaps (self > others by > 0.5)
    const gaps = scores.byCompetency.filter((c) => c.gapSelfVsOthers > 0.3);

    for (const gap of gaps) {
      // Get competency name
      const competency = await prisma.competency.findFirst({
        where: {
          organizationId: latestResult.assessment.organization.id,
          key: gap.competencyKey,
        },
        select: { name: true },
      });

      // Check if there's already an action for this competency
      const existingActions = await prisma.userAction.findMany({
        where: {
          userId,
          action: {
            competency: { key: gap.competencyKey },
          },
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        select: { id: true },
        take: 1,
      });

      recommendations.push({
        id: `gap-${gap.competencyKey}`,
        type: "competency_gap",
        title: `Close your ${competency?.name || gap.competencyKey} gap`,
        description: `Your self-rating (${gap.self.toFixed(1)}) is higher than others' perception (${Math.max(gap.peerAvg || 0, gap.manager || 0).toFixed(1)}). Practice behaviors that demonstrate this competency.`,
        priority: gap.gapSelfVsOthers > 0.8 ? "high" : gap.gapSelfVsOthers > 0.5 ? "medium" : "low",
        competencyKey: gap.competencyKey,
        competencyName: competency?.name || null,
        estimatedTimeMinutes: 15,
        source: "360_gap",
        matchedGap: gap.gapSelfVsOthers,
        actionId: existingActions[0]?.id || null,
      });
    }
  }

  // Get low-scoring competencies that need development
  const lowCompetencies = await prisma.competencyScoreSnapshot.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    distinct: ["competencyKey"],
    take: 10,
    select: {
      competencyKey: true,
      othersAverage: true,
    },
  });

  const weakAreas = lowCompetencies.filter((c) => c.othersAverage !== null && c.othersAverage < 3.0);

  for (const area of weakAreas) {
    // Skip if already have a gap recommendation for this
    if (recommendations.some((r) => r.competencyKey === area.competencyKey && r.type === "competency_gap")) {
      continue;
    }

    const competency = await prisma.competency.findFirst({
      where: { key: area.competencyKey },
      select: { name: true },
    });

    recommendations.push({
      id: `weak-${area.competencyKey}`,
      type: "development_area",
      title: `Strengthen ${competency?.name || area.competencyKey}`,
      description: `Your current score (${area.othersAverage?.toFixed(1)}) shows room for growth. Focus on development activities.`,
      priority: (area.othersAverage ?? 0) < 2.5 ? "high" : "medium",
      competencyKey: area.competencyKey,
      competencyName: competency?.name || null,
      estimatedTimeMinutes: 20,
      source: "system",
      matchedGap: null,
      actionId: null,
    });
  }

  // Add general skill-building recommendations
  const skillBuildingRecs: TrainingRecommendation[] = [
    {
      id: "skill-feedback",
      type: "skill_building",
      title: "Giving Constructive Feedback",
      description: "Learn frameworks for providing feedback that drives improvement.",
      priority: "medium",
      competencyKey: null,
      competencyName: null,
      estimatedTimeMinutes: 25,
      source: "system",
      matchedGap: null,
      actionId: null,
    },
    {
      id: "skill-coaching",
      type: "skill_building",
      title: "Coaching Conversations",
      description: "Practice coaching techniques for 1:1 development discussions.",
      priority: "low",
      competencyKey: null,
      competencyName: null,
      estimatedTimeMinutes: 30,
      source: "system",
      matchedGap: null,
      actionId: null,
    },
  ];

  recommendations.push(...skillBuildingRecs);

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    totalRecommendations: recommendations.length,
    highPriorityCount: recommendations.filter((r) => r.priority === "high").length,
    byCategory: {
      competencyGaps: recommendations.filter((r) => r.type === "competency_gap"),
      developmentAreas: recommendations.filter((r) => r.type === "development_area"),
      skillBuilding: recommendations.filter((r) => r.type === "skill_building"),
    },
  };
}
