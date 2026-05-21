"use server";

import { requireAdminOrganizationId } from "@/lib/admin/context";
import { getFeedback360Console, getPeopleDirectory, getTalentLists } from "@/lib/admin/queries";
import prisma from "@/lib/prisma";
import { EqAttemptStatus, IqAttemptStatus, PsychAttemptStatus } from "@/generated/prisma/enums";

function csvEscape(s: string | null | undefined): string {
  const v = (s ?? "").replace(/"/g, '""');
  return `"${v}"`;
}

function csvNum(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "";
  return n.toFixed(decimals);
}

export async function buildPeopleCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const rows = await getPeopleDirectory(orgId);
  const header = ["name", "email", "department", "role", "active"].join(",");
  const lines = rows.map(
    (r) =>
      [csvEscape(r.name), csvEscape(r.email), csvEscape(r.department), r.role, r.isActive ? "yes" : "no"].join(","),
  );
  return [header, ...lines].join("\n");
}

export async function build360Csv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const rows = await getFeedback360Console(orgId);
  const header = [
    "assessment_id",
    "subject_name",
    "subject_email",
    "template",
    "status",
    "progress_pct",
    "self_complete",
    "peers_complete",
    "manager_complete",
    "due_at",
    "updated_at",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      csvEscape(r.subjectName),
      csvEscape(r.subjectEmail),
      csvEscape(r.templateName),
      r.status,
      r.progressPct,
      r.selfComplete ? "yes" : "no",
      r.peersComplete ? "yes" : "no",
      r.managerComplete ? "yes" : "no",
      csvEscape(r.dueAt),
      csvEscape(r.updatedAt),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export async function buildEqCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const results = await prisma.eqTestResult.findMany({
    where: { attempt: { organizationId: orgId, status: EqAttemptStatus.COMPLETED } },
    include: {
      attempt: {
        include: {
          user: { select: { name: true, email: true } },
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "name", "email",
    "SelfAwareness", "SelfRegulation", "Motivation", "Empathy", "SocialSkills",
    "composite_score", "composite_percentile",
    "highest_domain", "lowest_domain",
    "template", "completed_at",
  ].join(",");

  const domainKeys = ["SelfAwareness", "SelfRegulation", "Motivation", "Empathy", "SocialSkills"] as const;

  const lines = results.map((r) => {
    const ds = (r.domainScores ?? {}) as Record<string, number>;
    return [
      csvEscape(r.attempt.user.name),
      csvEscape(r.attempt.user.email),
      ...domainKeys.map((k) => csvNum(ds[k], 1)),
      csvNum(r.compositeScore, 1),
      csvNum(r.percentileComposite, 1),
      csvEscape(r.highestDomain),
      csvEscape(r.lowestDomain),
      csvEscape(r.attempt.template.name),
      csvEscape(r.createdAt.toISOString()),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

export async function buildPsychometricCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const results = await prisma.psychTestResult.findMany({
    where: { attempt: { organizationId: orgId, status: PsychAttemptStatus.COMPLETED } },
    include: {
      attempt: {
        include: {
          user: { select: { name: true, email: true } },
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "name", "email",
    "Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism",
    "summary", "template", "completed_at",
  ].join(",");

  const traits = ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"] as const;

  const lines = results.map((r) => {
    const tp = (r.traitPercentiles ?? {}) as Record<string, number>;
    return [
      csvEscape(r.attempt.user.name),
      csvEscape(r.attempt.user.email),
      ...traits.map((k) => csvNum(tp[k], 1)),
      csvEscape(r.summaryLine),
      csvEscape(r.attempt.template.name),
      csvEscape(r.createdAt.toISOString()),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

export async function buildIqCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const results = await prisma.iqTestResult.findMany({
    where: { attempt: { organizationId: orgId, status: IqAttemptStatus.COMPLETED } },
    include: {
      attempt: {
        include: {
          user: { select: { name: true, email: true } },
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "name", "email",
    "raw_correct", "weighted_score", "max_weighted",
    "standard_score", "percentile",
    "ci_low", "ci_high", "category",
    "template", "completed_at",
  ].join(",");

  const lines = results.map((r) =>
    [
      csvEscape(r.attempt.user.name),
      csvEscape(r.attempt.user.email),
      r.rawCorrectCount,
      csvNum(r.weightedScore),
      csvNum(r.maxWeighted),
      csvNum(r.standardScore),
      csvNum(r.percentile, 1),
      csvNum(r.ciLow),
      csvNum(r.ciHigh),
      csvEscape(r.categoryLabel),
      csvEscape(r.attempt.template.name),
      csvEscape(r.createdAt.toISOString()),
    ].join(","),
  );

  return [header, ...lines].join("\n");
}

export async function buildTrainingImpactCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const enrollments = await prisma.trainingEnrollment.findMany({
    where: { trainingProgram: { organizationId: orgId } },
    include: {
      user: { select: { name: true, email: true } },
      trainingProgram: { select: { name: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const header = [
    "name", "email", "program",
    "pre", "post", "delta",
    "pct_change", "impact", "status", "completed_at",
  ].join(",");

  const lines = enrollments.map((e) => {
    const d = e.delta as Record<string, unknown> | null;
    const overall = (d?.overall ?? {}) as Record<string, number>;
    const pre = overall.pre;
    const post = overall.post;
    const delta = overall.delta;
    const pctChange = overall.percentChange;
    const impactLabel = String(overall.impact ?? d?.impact ?? "");

    return [
      csvEscape(e.user.name),
      csvEscape(e.user.email),
      csvEscape(e.trainingProgram.name),
      csvNum(pre, 1),
      csvNum(post, 1),
      csvNum(delta, 1),
      csvNum(pctChange, 0),
      csvEscape(impactLabel),
      e.status,
      csvEscape(e.completedAt?.toISOString()),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

export async function buildTalentCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const { highRisk, highPotential } = await getTalentLists(orgId);

  const header = ["name", "email", "type", "reason"].join(",");

  const riskLines = highRisk.map((r) =>
    [csvEscape(r.name), csvEscape(r.email), "high_risk", csvEscape(r.reason)].join(","),
  );
  const potLines = highPotential.map((r) =>
    [csvEscape(r.name), csvEscape(r.email), "high_potential", csvEscape(r.reason)].join(","),
  );

  return [header, ...riskLines, ...potLines].join("\n");
}
