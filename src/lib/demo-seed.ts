import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import {
  AssessmentInstanceStatus,
  AssessmentQuestionType,
  AssessmentTemplateType,
  EqAttemptStatus,
  EvaluatorRole,
  EvaluatorStatus,
  IqAttemptStatus,
  OrganizationRole,
  PsychAttemptStatus,
  ScoringStrategy,
  UserActionSource,
  UserActionStatus,
  TrainingContentQuestionType,
  TrainingContentTemplateKind,
} from "@/generated/prisma/enums";
import type { AssessmentQuestionType as AQT } from "@/generated/prisma/enums";
import { tryFinalizeAssessmentResult } from "@/lib/assessment-360-result";
import { parseEqScenarioOptions } from "@/lib/eq-question-config";
import { computeEqAssessmentResult, type EqResponseEntry } from "@/lib/eq-scoring";
import { computeIqScores } from "@/lib/iq-scoring";
import { getIsoWeekKey, previousWeekKey } from "@/lib/iso-week";
import { DEMO_ORG_SLUG, DEMO_ORG_SLUGS } from "@/lib/demo-constants";
import prisma from "@/lib/prisma";

type MemberSeed = {
  email: string;
  name: string;
  role: OrganizationRole;
  department: string;
};

/** Primary pilot — full team (360, IQ, EQ, psych, actions). */
const MEMBERS: MemberSeed[] = [
  { email: "admin@acme.com", name: "Alex Admin", role: OrganizationRole.ADMIN, department: "Leadership" },
  { email: "demo@acme.com", name: "Dana Demo", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng2@acme.com", name: "Evan Eng", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng3@acme.com", name: "Emma Eng", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng4@acme.com", name: "Eric Eng", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng5@acme.com", name: "Ella Eng", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "sales1@acme.com", name: "Sam Sales", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales2@acme.com", name: "Sara Sales", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales3@acme.com", name: "Steve Sales", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales4@acme.com", name: "Sofia Sales", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "lead1@acme.com", name: "Jordan Lead", role: OrganizationRole.EMPLOYEE, department: "Leadership" },
  { email: "lead2@acme.com", name: "Morgan Exec", role: OrganizationRole.EMPLOYEE, department: "Leadership" },
];

/** Beta Industries — same role mix as Acme for cross-tenant E2E. */
const BETA_MEMBERS: MemberSeed[] = [
  { email: "admin@beta-demo.com", name: "Blake Admin", role: OrganizationRole.ADMIN, department: "Leadership" },
  { email: "demo@beta-demo.com", name: "Dana Beta", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng2@beta-demo.com", name: "Evan Beta", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng3@beta-demo.com", name: "Emma Beta", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "eng4@beta-demo.com", name: "Eric Beta", role: OrganizationRole.EMPLOYEE, department: "Engineering" },
  { email: "sales1@beta-demo.com", name: "Sam Beta", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales2@beta-demo.com", name: "Sara Beta", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales3@beta-demo.com", name: "Steve Beta", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "sales4@beta-demo.com", name: "Sofia Beta", role: OrganizationRole.EMPLOYEE, department: "Sales" },
  { email: "lead1@beta-demo.com", name: "Jordan Beta", role: OrganizationRole.EMPLOYEE, department: "Leadership" },
  { email: "lead2@beta-demo.com", name: "Morgan Beta", role: OrganizationRole.EMPLOYEE, department: "Leadership" },
];

const GAMMA_MEMBERS: MemberSeed[] = BETA_MEMBERS.map((m) => ({
  ...m,
  email: m.email.replace("beta-demo", "gamma-demo"),
  name: m.name.replace("Beta", "Gamma"),
}));

const DELTA_MEMBERS: MemberSeed[] = BETA_MEMBERS.map((m) => ({
  ...m,
  email: m.email.replace("beta-demo", "delta-demo"),
  name: m.name.replace("Beta", "Delta"),
}));

type Demo360Pattern = {
  subject: string;
  evals: { email: string; role: EvaluatorRole }[];
  matrix: number[][];
};

/** Same Likert matrices as legacy Acme demo (4 evaluators × 6 questions = 24). */
const MATRIX_DEMO_A = [
  5, 3, 3, 4, 5, 3, 3, 4, 5, 2, 3, 3, 5, 4, 5, 3, 4, 3, 5, 3, 3, 4, 4, 4,
];
const MATRIX_DEMO_B = [
  3, 4, 4, 4, 3, 3, 4, 4, 4, 4, 4, 5, 3, 3, 4, 4, 4, 3, 3, 4, 4, 4, 3, 3,
];
const MATRIX_DEMO_C = [
  4, 4, 3, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 4, 4, 4, 3, 4, 4, 3, 4, 4, 4,
];

function acme360Patterns(): Demo360Pattern[] {
  return [
    {
      subject: "demo@acme.com",
      evals: [
        { email: "demo@acme.com", role: EvaluatorRole.SELF },
        { email: "eng2@acme.com", role: EvaluatorRole.PEER },
        { email: "eng3@acme.com", role: EvaluatorRole.PEER },
        { email: "admin@acme.com", role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_A],
    },
    {
      subject: "eng2@acme.com",
      evals: [
        { email: "eng2@acme.com", role: EvaluatorRole.SELF },
        { email: "demo@acme.com", role: EvaluatorRole.PEER },
        { email: "eng4@acme.com", role: EvaluatorRole.PEER },
        { email: "admin@acme.com", role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_B],
    },
    {
      subject: "sales1@acme.com",
      evals: [
        { email: "sales1@acme.com", role: EvaluatorRole.SELF },
        { email: "sales2@acme.com", role: EvaluatorRole.PEER },
        { email: "sales3@acme.com", role: EvaluatorRole.PEER },
        { email: "lead1@acme.com", role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_C],
    },
  ];
}

function tenant360Patterns(domain: "beta-demo.com" | "gamma-demo.com" | "delta-demo.com"): Demo360Pattern[] {
  const admin = `admin@${domain}`;
  const demo = `demo@${domain}`;
  const eng2 = `eng2@${domain}`;
  const eng3 = `eng3@${domain}`;
  const eng4 = `eng4@${domain}`;
  const sales1 = `sales1@${domain}`;
  const sales2 = `sales2@${domain}`;
  const sales3 = `sales3@${domain}`;
  const lead1 = `lead1@${domain}`;
  return [
    {
      subject: demo,
      evals: [
        { email: demo, role: EvaluatorRole.SELF },
        { email: eng2, role: EvaluatorRole.PEER },
        { email: eng3, role: EvaluatorRole.PEER },
        { email: admin, role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_A],
    },
    {
      subject: eng2,
      evals: [
        { email: eng2, role: EvaluatorRole.SELF },
        { email: demo, role: EvaluatorRole.PEER },
        { email: eng4, role: EvaluatorRole.PEER },
        { email: admin, role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_B],
    },
    {
      subject: sales1,
      evals: [
        { email: sales1, role: EvaluatorRole.SELF },
        { email: sales2, role: EvaluatorRole.PEER },
        { email: sales3, role: EvaluatorRole.PEER },
        { email: lead1, role: EvaluatorRole.MANAGER },
      ],
      matrix: [MATRIX_DEMO_C],
    },
  ];
}

function bestScenarioOption(config: unknown): string {
  const opts = parseEqScenarioOptions(config);
  let best = opts[0];
  if (!best) return "opt_0";
  for (const o of opts) {
    const bp = best.eqPoints ?? 0;
    const op = o.eqPoints ?? 0;
    if (op > bp) best = o;
  }
  return best.id;
}

async function seedCompetenciesAndActions(orgId: string, orgDisplayName: string) {
  const defs = [
    {
      key: "communication",
      name: "Communication",
      actions: [
        { title: "Practice concise updates", description: "Deliver a weekly written update in five sentences or fewer.", difficulty: "EASY" as const, estimatedTime: 15 },
        { title: "Run a feedback retro", description: "Ask two peers for one thing to start and one to stop.", difficulty: "MEDIUM" as const, estimatedTime: 45 },
      ],
    },
    {
      key: "leadership",
      name: "Leadership",
      actions: [
        { title: "Delegate one decision", description: "Hand off a decision you would normally own; document the outcome.", difficulty: "MEDIUM" as const, estimatedTime: 30 },
        { title: "Clarify team priorities", description: "Publish top three priorities for the week in your team channel.", difficulty: "EASY" as const, estimatedTime: 20 },
      ],
    },
    {
      key: "collaboration",
      name: "Collaboration",
      actions: [
        { title: "Pair on a task", description: "Schedule a 45-minute pairing session with a cross-functional peer.", difficulty: "MEDIUM" as const, estimatedTime: 45 },
        { title: "Share context early", description: "Post risks or dependencies before stand-up.", difficulty: "EASY" as const, estimatedTime: 10 },
      ],
    },
  ];

  const out: { competencyId: string; actionIds: string[] }[] = [];
  for (const d of defs) {
    const comp = await prisma.competency.create({
      data: {
        organizationId: orgId,
        key: d.key,
        name: d.name,
        description: `${d.name} development area for ${orgDisplayName}.`,
        sortOrder: out.length,
        isActive: true,
      },
    });
    const actionIds: string[] = [];
    for (let i = 0; i < d.actions.length; i++) {
      const a = d.actions[i]!;
      const row = await prisma.action.create({
        data: {
          competencyId: comp.id,
          title: a.title,
          description: a.description,
          difficulty: a.difficulty,
          estimatedTime: a.estimatedTime,
          sortOrder: i,
          isActive: true,
        },
      });
      actionIds.push(row.id);
    }
    out.push({ competencyId: comp.id, actionIds });
  }
  return out;
}

async function seed360(
  orgId: string,
  userByEmail: Map<string, { id: string }>,
  competencyKeys: string[],
  patterns: Demo360Pattern[],
  orgName: string,
  adminEmail: string,
) {
  const template = await prisma.assessmentTemplate.create({
    data: {
      organizationId: orgId,
      type: AssessmentTemplateType.BEHAVIORAL_360,
      key: "demo-360-core",
      name: `${orgName} 360 — Core competencies`,
      description: "Multi-rater feedback on communication, leadership, and collaboration.",
      scoringStrategy: ScoringStrategy.MULTI_SOURCE,
      config: {},
      sortOrder: 1,
      isActive: true,
    },
  });

  const qDefs: Array<{ key: string; trait: string; prompt: string }> = [];
  for (const trait of competencyKeys) {
    qDefs.push(
      { key: `${trait}_a`, trait, prompt: `Demonstrates ${trait} in day-to-day work.` },
      { key: `${trait}_b`, trait, prompt: `Seeks feedback related to ${trait}.` },
    );
  }

  const questions: { id: string; traitCategory: string | null }[] = [];
  for (let i = 0; i < qDefs.length; i++) {
    const q = qDefs[i]!;
    const row = await prisma.question.create({
      data: {
        organizationId: orgId,
        templateId: template.id,
        key: q.key,
        questionType: AssessmentQuestionType.LIKERT_360,
        config: {
          prompt: q.prompt,
          type: "scale",
          assessmentQuestionType: "LIKERT_360",
          scaleMin: 1,
          scaleMax: 5,
        },
        traitCategory: q.trait,
        weight: new Prisma.Decimal(1),
        sortOrder: i,
        isActive: true,
      },
    });
    questions.push({ id: row.id, traitCategory: row.traitCategory });
  }

  const qOrder = questions;
  if (qOrder.length !== 6) {
    throw new Error(`Expected 6 demo 360 questions, got ${qOrder.length}`);
  }

  for (let pi = 0; pi < patterns.length; pi++) {
    const p = patterns[pi]!;
    const subject = userByEmail.get(p.subject);
    if (!subject) throw new Error(`Missing user ${p.subject}`);

    const assessment = await prisma.assessment.create({
      data: {
        organizationId: orgId,
        templateId: template.id,
        subjectUserId: subject.id,
        title: `360 — Wave ${pi + 1}`,
        status: AssessmentInstanceStatus.ACTIVE,
        createdByUserId: userByEmail.get(adminEmail)!.id,
        dueAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    const evalRows: { id: string; email: string }[] = [];
    for (const ev of p.evals) {
      const u = userByEmail.get(ev.email);
      if (!u) throw new Error(`Missing evaluator ${ev.email}`);
      const row = await prisma.assessmentEvaluator.create({
        data: {
          assessmentId: assessment.id,
          userId: u.id,
          role: ev.role,
          status: EvaluatorStatus.COMPLETED,
          submittedAt: new Date(),
        },
      });
      evalRows.push({ id: row.id, email: ev.email });
    }

    const flat = p.matrix[0]!;
    if (flat.length !== evalRows.length * qOrder.length) {
      throw new Error("360 response matrix size mismatch");
    }

    let idx = 0;
    for (const ev of evalRows) {
      for (const q of qOrder) {
        const val = flat[idx++]!;
        await prisma.assessmentResponse.create({
          data: {
            evaluatorId: ev.id,
            questionId: q.id,
            numericValue: val,
          },
        });
      }
    }

    await tryFinalizeAssessmentResult(assessment.id);
  }
}

async function seedIqDemo(
  orgId: string,
  userByEmail: Map<string, { id: string }>,
  templateId: string,
  emails: { demo: string; eng2: string },
) {
  const pool = await prisma.question.findMany({
    where: { templateId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
  if (pool.length < 50) throw new Error("IQ pool should have 50 questions");

  const demoUser = userByEmail.get(emails.demo)!;
  const engUser = userByEmail.get(emails.eng2)!;
  const now = new Date();
  const endsFar = new Date(now.getTime() + 3600_000);

  const q50 = pool.slice(0, 50);
  const questionIds = q50.map((q) => q.id);
  const ordered = q50.map((q) => ({
    id: q.id,
    questionType: q.questionType as AQT,
    correctOptionId: q.correctOptionId,
    weight: Number(q.weight),
  }));

  const correctResponses: Record<string, string> = {};
  for (const q of q50) {
    if (!q.correctOptionId) continue;
    correctResponses[q.id] = q.correctOptionId;
  }

  const wrongResponses: Record<string, string> = { ...correctResponses };
  for (let i = 41; i < 50; i++) {
    const q = q50[i]!;
    if (!q.correctOptionId) continue;
    const cfg = q.config as { options?: { id: string }[] };
    const opts = cfg.options ?? [];
    const wrong = opts.find((o) => o.id !== q.correctOptionId);
    if (wrong) wrongResponses[q.id] = wrong.id;
  }

  const scored = computeIqScores(ordered, wrongResponses);

  const completed = await prisma.iqTestAttempt.create({
    data: {
      userId: demoUser.id,
      organizationId: orgId,
      templateId,
      status: IqAttemptStatus.COMPLETED,
      startedAt: new Date(now.getTime() - 600_000),
      submittedAt: now,
      endsAt: now,
      questionIds,
      responses: wrongResponses as object,
    },
  });

  await prisma.iqTestResult.create({
    data: {
      attemptId: completed.id,
      rawCorrectCount: scored.rawCorrectCount,
      weightedScore: scored.weightedScore,
      maxWeighted: scored.maxWeighted,
      standardScore: scored.standardScore,
      percentile: scored.percentile,
      ciLow: scored.ciLow,
      ciHigh: scored.ciHigh,
      categoryLabel: scored.categoryLabel,
      breakdownByCategory: scored.breakdownByCategory as object,
      interpretation: scored.interpretation,
    },
  });

  const partial: Record<string, string> = {};
  for (let i = 0; i < 3; i++) {
    const q = q50[i]!;
    if (q.correctOptionId) partial[q.id] = q.correctOptionId;
  }

  await prisma.iqTestAttempt.create({
    data: {
      userId: engUser.id,
      organizationId: orgId,
      templateId,
      status: IqAttemptStatus.IN_PROGRESS,
      startedAt: now,
      endsAt: endsFar,
      questionIds,
      responses: partial as object,
    },
  });
}

async function seedEqDemo(
  orgId: string,
  userByEmail: Map<string, { id: string }>,
  templateId: string,
  demoEmail: string,
) {
  const questions = await prisma.question.findMany({
    where: { templateId, isActive: true },
    orderBy: [{ sortOrder: "asc" }],
  });
  const demoUser = userByEmail.get(demoEmail)!;
  const questionIds = questions.map((q) => q.id);
  const raw: Record<string, EqResponseEntry> = {};

  for (const q of questions) {
    if (q.questionType === AssessmentQuestionType.EQ_SCENARIO) {
      raw[q.id] = { scenarioOptionId: bestScenarioOption(q.config) };
    } else if (q.questionType === AssessmentQuestionType.EQ_SELF_REPORT) {
      raw[q.id] = { likert: 6 };
    }
  }

  const scoredInput = questions.map((q) => ({
    id: q.id,
    questionType: q.questionType as AQT,
    traitCategory: q.traitCategory,
    reverseScored: q.reverseScored,
    config: q.config,
  }));

  const computed = computeEqAssessmentResult(scoredInput, raw);
  const now = new Date();

  const attempt = await prisma.eqTestAttempt.create({
    data: {
      userId: demoUser.id,
      organizationId: orgId,
      templateId,
      status: EqAttemptStatus.COMPLETED,
      startedAt: new Date(now.getTime() - 900_000),
      submittedAt: now,
      questionIds,
      responses: raw as object,
      currentSectionIndex: 4,
      lastSavedAt: now,
    },
  });

  await prisma.eqTestResult.create({
    data: {
      attemptId: attempt.id,
      domainScores: computed.domainScores as object,
      compositeScore: computed.compositeScore,
      percentileComposite: computed.percentileComposite,
      percentileByDomain: computed.percentileByDomain as object,
      highestDomain: computed.highestDomain,
      lowestDomain: computed.lowestDomain,
      consistencyFlags: computed.consistencyFlags as object,
      narrativeText: computed.narrativeText,
      quadrantLabel: computed.quadrantLabel,
      heatmapPosition: computed.heatmapPosition as object,
    },
  });
}

async function seedPsychInProgress(
  orgId: string,
  userByEmail: Map<string, { id: string }>,
  templateId: string,
  participantEmail: string,
) {
  const qs = await prisma.question.findMany({
    where: { templateId, isActive: true },
    take: 5,
    orderBy: { sortOrder: "asc" },
  });
  if (qs.length === 0) return;
  const u = userByEmail.get(participantEmail)!;
  const now = new Date();
  await prisma.psychTestAttempt.create({
    data: {
      userId: u.id,
      organizationId: orgId,
      templateId,
      status: PsychAttemptStatus.IN_PROGRESS,
      startedAt: now,
      questionIds: qs.map((q) => q.id),
      responses: {},
      currentPageIndex: 0,
      lastSavedAt: now,
    },
  });
}

async function seedIqTemplate(orgId: string, orgName: string, iqKeyPrefix: string) {
  const template = await prisma.assessmentTemplate.create({
    data: {
      organizationId: orgId,
      type: AssessmentTemplateType.IQ_COGNITIVE,
      key: "demo-iq-bank",
      name: `${orgName} cognitive bank`,
      description: "Fifty pooled items for demo scoring (~standard score 118 at ~82% correct).",
      scoringStrategy: ScoringStrategy.SUM_CORRECT,
      config: {
        questionsPerTest: 50,
        totalTimeSeconds: 3600,
        defaultQuestionTimeSeconds: 90,
        retakeCooldownMonths: 0,
        passingStandardScore: 100,
      },
      sortOrder: 2,
      isActive: true,
    },
  });

  const stems: Array<{ key: string; questionType: AssessmentQuestionType; prompt: string; options: { id: string; label: string }[]; correctId: string }> = [
    {
      key: "n",
      questionType: AssessmentQuestionType.NUMERICAL_SEQUENCE,
      prompt: "What number comes next? 1, 3, 5, 7, ?",
      options: [
        { id: "o0", label: "8" },
        { id: "o1", label: "9" },
        { id: "o2", label: "10" },
        { id: "o3", label: "11" },
      ],
      correctId: "o1",
    },
    {
      key: "l",
      questionType: AssessmentQuestionType.LOGICAL_PATTERN,
      prompt: "If it rains, the ground is wet. The ground is not wet. What follows?",
      options: [
        { id: "o0", label: "It is raining." },
        { id: "o1", label: "It is not raining." },
        { id: "o2", label: "Unclear." },
        { id: "o3", label: "No conclusion." },
      ],
      correctId: "o1",
    },
    {
      key: "v",
      questionType: AssessmentQuestionType.VERBAL_ANALOGY,
      prompt: "Ocean is to Water as Desert is to ?",
      options: [
        { id: "o0", label: "Camel" },
        { id: "o1", label: "Sand" },
        { id: "o2", label: "Heat" },
        { id: "o3", label: "Sun" },
      ],
      correctId: "o1",
    },
    {
      key: "l2",
      questionType: AssessmentQuestionType.LOGICAL_PATTERN,
      prompt: "All bloops are flarks. This is a bloop. What is most sound?",
      options: [
        { id: "o0", label: "It is a flark." },
        { id: "o1", label: "It might not be a flark." },
        { id: "o2", label: "It is not a bloop." },
        { id: "o3", label: "No statement is sound." },
      ],
      correctId: "o0",
    },
    {
      key: "n2",
      questionType: AssessmentQuestionType.NUMERICAL_SEQUENCE,
      prompt: "2, 4, 8, 16, ?",
      options: [
        { id: "o0", label: "24" },
        { id: "o1", label: "32" },
        { id: "o2", label: "40" },
        { id: "o3", label: "64" },
      ],
      correctId: "o1",
    },
  ];

  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < stems.length; i++) {
      const s = stems[i]!;
      const key = `iq_${iqKeyPrefix}_${r}_${i}`;
      const config = {
        prompt: `${s.prompt} (set ${r + 1})`,
        type: "single_choice" as const,
        options: s.options.map((o) => ({ ...o, value: o.label })),
        assessmentQuestionType: s.questionType,
      };
      const sortOrder = r * stems.length + i;
      await prisma.question.create({
        data: {
          organizationId: orgId,
          templateId: template.id,
          key,
          questionType: s.questionType,
          config,
          correctOptionId: s.correctId,
          weight: new Prisma.Decimal(1),
          timeLimitSeconds: 90,
          sortOrder,
          isActive: true,
        },
      });
    }
  }

  return template.id;
}

async function seedEqTemplate(orgId: string, orgName: string) {
  const template = await prisma.assessmentTemplate.create({
    data: {
      organizationId: orgId,
      type: AssessmentTemplateType.EQ_ASSESSMENT,
      key: "demo-eq-bank",
      name: `${orgName} EQ profile`,
      description: "Ten items across Goleman domains.",
      scoringStrategy: ScoringStrategy.TRAIT_AGGREGATE,
      config: {},
      sortOrder: 3,
      isActive: true,
    },
  });

  type EqSeed = {
    key: string;
    domain: "SelfAwareness" | "SelfRegulation" | "Motivation" | "Empathy" | "SocialSkills";
    kind: "scenario" | "self";
    prompt?: string;
    reverse?: boolean;
    options?: Array<{ label: string; eqPoints: number; rationale: string }>;
    selfText?: string;
  };

  const eqItems: EqSeed[] = [
    {
      key: "eq_sa_s1",
      domain: "SelfAwareness",
      kind: "scenario",
      prompt: "After receiving tough feedback, what is the most emotionally intelligent first step?",
      options: [
        { label: "Send a sharp reply defending your work", eqPoints: 20, rationale: "Defensiveness usually closes the door to learning." },
        { label: "Ask one clarifying question before responding", eqPoints: 85, rationale: "Curiosity slows reactivity and models respect." },
        { label: "Pretend you agree even if you don’t", eqPoints: 35, rationale: "People-pleasing avoids the real conversation." },
        { label: "Ignore it until you feel calmer", eqPoints: 55, rationale: "A pause helps, but engagement matters too." },
      ],
    },
    {
      key: "eq_sa_sr",
      domain: "SelfAwareness",
      kind: "self",
      selfText: "I can usually name what I am feeling in the moment.",
    },
    {
      key: "eq_sr_s1",
      domain: "SelfRegulation",
      kind: "scenario",
      prompt: "A colleague interrupts you repeatedly in a meeting. What best reflects self-regulation?",
      options: [
        { label: "Interrupt them back to regain airtime", eqPoints: 25, rationale: "Matching escalation rarely helps the group." },
        { label: "Name the pattern calmly and propose turn-taking", eqPoints: 90, rationale: "Clear boundaries without contempt." },
        { label: "Stay silent to avoid conflict", eqPoints: 40, rationale: "Silence can breed resentment." },
        { label: "Leave the meeting abruptly", eqPoints: 15, rationale: "Flight avoids repair." },
      ],
    },
    {
      key: "eq_sr_self",
      domain: "SelfRegulation",
      kind: "self",
      selfText: "I often act impulsively when I feel criticized.",
      reverse: true,
    },
    {
      key: "eq_mo_s1",
      domain: "Motivation",
      kind: "scenario",
      prompt: "When motivation dips mid-project, what is the most constructive move?",
      options: [
        { label: "Focus on one small next step tied to purpose", eqPoints: 88, rationale: "Re-anchors energy without denial of fatigue." },
        { label: "Complain to peers about the workload", eqPoints: 30, rationale: "Venting can bond people but rarely restores drive." },
        { label: "Wait until you feel inspired again", eqPoints: 35, rationale: "Motivation often follows action, not the reverse." },
        { label: "Push through without breaks", eqPoints: 40, rationale: "Sustainability beats short bursts." },
      ],
    },
    {
      key: "eq_mo_self",
      domain: "Motivation",
      kind: "self",
      selfText: "I find ways to reconnect with why my work matters.",
    },
    {
      key: "eq_em_s1",
      domain: "Empathy",
      kind: "scenario",
      prompt: "A teammate seems withdrawn. What is the most empathic opening?",
      options: [
        { label: "Ignore it — it is not your business", eqPoints: 25, rationale: "Care can be offered without prying." },
        { label: "Ask privately if they want company or space", eqPoints: 92, rationale: "Respects autonomy while offering support." },
        { label: "Tell others they seem off", eqPoints: 15, rationale: "Triangulation erodes trust." },
        { label: "Assume they are fine unless they say otherwise", eqPoints: 35, rationale: "Check-ins can prevent isolation." },
      ],
    },
    {
      key: "eq_em_self",
      domain: "Empathy",
      kind: "self",
      selfText: "I try to imagine how others might feel in tense situations.",
    },
    {
      key: "eq_ss_s1",
      domain: "SocialSkills",
      kind: "scenario",
      prompt: "You disagree with a friend’s idea in a group setting. What is most skillful?",
      options: [
        { label: "Praise in public, critique in private", eqPoints: 88, rationale: "Protects dignity while staying honest." },
        { label: "Point out flaws in front of everyone", eqPoints: 25, rationale: "Public shame rarely invites collaboration." },
        { label: "Agree to avoid awkwardness", eqPoints: 35, rationale: "False harmony stores problems." },
        { label: "Stay quiet and hope it passes", eqPoints: 40, rationale: "Avoidance can stall the group." },
      ],
    },
    {
      key: "eq_ss_self",
      domain: "SocialSkills",
      kind: "self",
      selfText: "I can give feedback in a way that others can hear.",
    },
  ];

  for (let i = 0; i < eqItems.length; i++) {
    const it = eqItems[i]!;
    if (it.kind === "scenario") {
      const opts = it.options!.map((o, j) => ({
        id: `opt_${j}`,
        label: o.label,
        value: o.label,
        eqPoints: o.eqPoints,
        rationale: o.rationale,
      }));
      const config = {
        prompt: it.prompt,
        type: "single_choice",
        options: opts,
        assessmentQuestionType: AssessmentQuestionType.EQ_SCENARIO,
      };
      await prisma.question.create({
        data: {
          organizationId: orgId,
          templateId: template.id,
          key: it.key,
          questionType: AssessmentQuestionType.EQ_SCENARIO,
          config,
          traitCategory: it.domain,
          weight: new Prisma.Decimal(1),
          sortOrder: i,
          isActive: true,
          reverseScored: false,
        },
      });
    } else {
      const config = {
        prompt: it.selfText,
        type: "scale",
        assessmentQuestionType: AssessmentQuestionType.EQ_SELF_REPORT,
        scaleMin: 1,
        scaleMax: 7,
      };
      await prisma.question.create({
        data: {
          organizationId: orgId,
          templateId: template.id,
          key: it.key,
          questionType: AssessmentQuestionType.EQ_SELF_REPORT,
          config,
          traitCategory: it.domain,
          weight: new Prisma.Decimal(1),
          sortOrder: i,
          isActive: true,
          reverseScored: Boolean(it.reverse),
        },
      });
    }
  }

  return template.id;
}

async function seedPsychTemplate(orgId: string, orgName: string) {
  const template = await prisma.assessmentTemplate.create({
    data: {
      organizationId: orgId,
      type: AssessmentTemplateType.PSYCHOMETRIC,
      key: "demo-psych-mini",
      name: `${orgName} personality mini`,
      description: "Short forced-choice demo (ipsative triads).",
      scoringStrategy: ScoringStrategy.TRAIT_AGGREGATE,
      config: { itemsPerPage: 5, retakeCooldownMonths: 12 },
      sortOrder: 4,
      isActive: true,
    },
  });

  const psychTriads: Array<{
    key: string;
    statements: { id: string; text: string; trait: string }[];
  }> = [
    {
      key: "psych_fc_d1",
      statements: [
        { id: "s0", text: "I enjoy exploring new ideas and unfamiliar topics.", trait: "Openness" },
        { id: "s1", text: "I follow through on commitments and meet deadlines.", trait: "Conscientiousness" },
        { id: "s2", text: "I feel energized in lively group settings.", trait: "Extraversion" },
      ],
    },
    {
      key: "psych_fc_d2",
      statements: [
        { id: "s0", text: "I try to see others’ points of view before deciding.", trait: "Agreeableness" },
        { id: "s1", text: "I often notice tension or worry before others do.", trait: "Neuroticism" },
        { id: "s2", text: "I like experimenting with different ways of doing things.", trait: "Openness" },
      ],
    },
    {
      key: "psych_fc_d3",
      statements: [
        { id: "s0", text: "I keep my workspace and tasks organized.", trait: "Conscientiousness" },
        { id: "s1", text: "I speak up readily in meetings.", trait: "Extraversion" },
        { id: "s2", text: "I assume people mean well until proven otherwise.", trait: "Agreeableness" },
      ],
    },
  ];

  for (let i = 0; i < psychTriads.length; i++) {
    const it = psychTriads[i]!;
    const config = {
      prompt: `Which line is most like you, and which is least like you? (${i + 1} of ${psychTriads.length})`,
      statements: it.statements,
      psychItemKind: "normal" as const,
      assessmentQuestionType: AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
    };
    await prisma.question.create({
      data: {
        organizationId: orgId,
        templateId: template.id,
        key: it.key,
        questionType: AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
        config,
        traitCategory: null,
        weight: new Prisma.Decimal(1),
        sortOrder: i,
        isActive: true,
        reverseScored: false,
      },
    });
  }

  return template.id;
}

/**
 * Global (org-scoped null) training content template so HR admins can select
 * "Knowledge / behavioral test" without using Super Admin. Idempotent by name.
 */
export async function seedGlobalDemoTrainingContentTemplates(): Promise<void> {
  const name = "Demo: Excel Skills (sample)";
  const existing = await prisma.trainingContentTemplate.findFirst({
    where: { organizationId: null, name },
  });
  if (existing) return;

  const stems: Array<{ text: string; options: [string, string, string, string]; correctIndex: number }> = [
    {
      text: "What is the primary purpose of Ctrl+S in Excel?",
      options: ["Save the workbook", "Print the sheet", "Undo the last action", "Close Excel"],
      correctIndex: 0,
    },
    {
      text: "Which formula adds the values in cells A1 through A10?",
      options: ["=SUM(A1:A10)", "=A1+A10", "=ADD(A1:A10)", "=TOTAL(A1:A10)"],
      correctIndex: 0,
    },
    {
      text: "What does the $ in $A$1 mean?",
      options: ["The row and column are absolute references", "The cell is locked from editing", "The value is a currency format", "The cell is hidden"],
      correctIndex: 0,
    },
    {
      text: "Which function looks up a value in the first column of a table and returns a value in the same row?",
      options: ["VLOOKUP", "SUMIF", "COUNTA", "CONCAT"],
      correctIndex: 0,
    },
    {
      text: "What is a pivot table mainly used for?",
      options: ["Summarizing and analyzing grouped data", "Drawing charts only", "Protecting cells", "Spell checking"],
      correctIndex: 0,
    },
    {
      text: "Which file extension is the default for modern Excel workbooks?",
      options: [".xlsx", ".xls", ".csv", ".docx"],
      correctIndex: 0,
    },
    {
      text: "What does IFERROR typically help you do?",
      options: ["Show a fallback when a formula errors", "Remove all errors from the disk", "Highlight errors in red only", "Convert text to numbers"],
      correctIndex: 0,
    },
    {
      text: "Which keyboard shortcut opens Find in Excel (Windows)?",
      options: ["Ctrl+F", "Ctrl+H", "Ctrl+G", "Ctrl+N"],
      correctIndex: 0,
    },
    {
      text: "What does freezing panes let you keep visible while scrolling?",
      options: ["Selected rows and/or columns", "Only charts", "Only comments", "Only images"],
      correctIndex: 0,
    },
    {
      text: "Which feature removes duplicate rows from a selected range?",
      options: ["Remove Duplicates (Data tab)", "Conditional Formatting", "Goal Seek", "Subtotal"],
      correctIndex: 0,
    },
  ];

  await prisma.trainingContentTemplate.create({
    data: {
      organizationId: null,
      kind: TrainingContentTemplateKind.KNOWLEDGE_TEST,
      name,
      description:
        "Sample 10-question knowledge check with a 20-minute timer. Published globally for Training Impact demos.",
      minQuestions: 5,
      maxQuestions: 50,
      defaultQuestionCount: 10,
      hasTimer: true,
      timeLimitMinutes: 20,
      defaultOptionCount: 4,
      isPublished: true,
      questions: {
        create: stems.map((q, qi) => {
          const optionRows = q.options.map((text, oi) => ({
            id: randomUUID(),
            text,
            sortOrder: oi,
            value: oi,
          }));
          const correctId = optionRows[q.correctIndex]?.id;
          if (!correctId) throw new Error("demo template: bad correctIndex");
          return {
            text: q.text,
            type: TrainingContentQuestionType.SINGLE_CHOICE,
            sortOrder: qi,
            correctOptionIds: [correctId],
            points: 1,
            minOptions: 3,
            maxOptions: 6,
            explanation: null,
            options: {
              create: optionRows.map((o) => ({
                id: o.id,
                text: o.text,
                sortOrder: o.sortOrder,
                value: o.value,
              })),
            },
          };
        }),
      },
    },
  });
}

async function seedManualActions(
  orgId: string,
  userByEmail: Map<string, { id: string }>,
  competencyBundles: { competencyId: string; actionIds: string[] }[],
  pairs: Array<{ email: string; actionIndex: number; compIndex: number; status: UserActionStatus; wk: string }>,
) {
  for (const row of pairs) {
    const u = userByEmail.get(row.email);
    const bundle = competencyBundles[row.compIndex];
    const actionId = bundle?.actionIds[row.actionIndex];
    if (!u || !actionId) continue;
    await prisma.userAction.create({
      data: {
        userId: u.id,
        actionId,
        organizationId: orgId,
        status: row.status,
        source: UserActionSource.MANUAL,
        weekKey: row.wk,
        assignedAt: new Date(),
        completedAt: row.status === UserActionStatus.COMPLETED ? new Date() : null,
      },
    });
  }
}

export async function wipeDemoOrganization(): Promise<void> {
  await prisma.organization.deleteMany({ where: { slug: { in: [...DEMO_ORG_SLUGS] } } });
}

type OrgSeedConfig = {
  slug: string;
  name: string;
  members: MemberSeed[];
  patterns360: Demo360Pattern[];
  iqKeyPrefix: string;
  adminEmail: string;
  demoEmail: string;
  eng2Email: string;
  psychParticipantEmail: string;
  manualPairs: Array<{
    email: string;
    actionIndex: number;
    compIndex: number;
    status: UserActionStatus;
    wk: string;
  }>;
};

function manualPairsForTenant(domain: string, week: string, prev: string) {
  return [
    { email: `eng3@${domain}`, compIndex: 0, actionIndex: 0, status: UserActionStatus.COMPLETED, wk: prev },
    { email: `sales4@${domain}`, compIndex: 1, actionIndex: 1, status: UserActionStatus.IN_PROGRESS, wk: week },
    { email: `lead2@${domain}`, compIndex: 2, actionIndex: 0, status: UserActionStatus.ASSIGNED, wk: week },
  ];
}

export async function seedDemoOrganization(): Promise<void> {
  const passwordDemo = await bcrypt.hash("demo123", 10);
  const passwordAdmin = await bcrypt.hash("admin123", 10);

  await wipeDemoOrganization();

  const week = getIsoWeekKey();
  const prev = previousWeekKey(week);

  const orgs: OrgSeedConfig[] = [
    {
      slug: DEMO_ORG_SLUG,
      name: "Acme Corp",
      members: MEMBERS,
      patterns360: acme360Patterns(),
      iqKeyPrefix: "acme",
      adminEmail: "admin@acme.com",
      demoEmail: "demo@acme.com",
      eng2Email: "eng2@acme.com",
      psychParticipantEmail: "sales2@acme.com",
      manualPairs: [
        { email: "eng3@acme.com", compIndex: 0, actionIndex: 0, status: UserActionStatus.COMPLETED, wk: prev },
        { email: "sales4@acme.com", compIndex: 1, actionIndex: 1, status: UserActionStatus.IN_PROGRESS, wk: week },
        { email: "lead2@acme.com", compIndex: 2, actionIndex: 0, status: UserActionStatus.ASSIGNED, wk: week },
      ],
    },
    {
      slug: "beta-demo",
      name: "Beta Industries",
      members: BETA_MEMBERS,
      patterns360: tenant360Patterns("beta-demo.com"),
      iqKeyPrefix: "beta",
      adminEmail: "admin@beta-demo.com",
      demoEmail: "demo@beta-demo.com",
      eng2Email: "eng2@beta-demo.com",
      psychParticipantEmail: "sales2@beta-demo.com",
      manualPairs: manualPairsForTenant("beta-demo.com", week, prev),
    },
    {
      slug: "gamma-demo",
      name: "Gamma Labs",
      members: GAMMA_MEMBERS,
      patterns360: tenant360Patterns("gamma-demo.com"),
      iqKeyPrefix: "gamma",
      adminEmail: "admin@gamma-demo.com",
      demoEmail: "demo@gamma-demo.com",
      eng2Email: "eng2@gamma-demo.com",
      psychParticipantEmail: "sales2@gamma-demo.com",
      manualPairs: manualPairsForTenant("gamma-demo.com", week, prev),
    },
    {
      slug: "delta-demo",
      name: "Delta Systems",
      members: DELTA_MEMBERS,
      patterns360: tenant360Patterns("delta-demo.com"),
      iqKeyPrefix: "delta",
      adminEmail: "admin@delta-demo.com",
      demoEmail: "demo@delta-demo.com",
      eng2Email: "eng2@delta-demo.com",
      psychParticipantEmail: "sales2@delta-demo.com",
      manualPairs: manualPairsForTenant("delta-demo.com", week, prev),
    },
  ];

  for (const cfg of orgs) {
    const org = await prisma.organization.create({
      data: {
        slug: cfg.slug,
        name: cfg.name,
        settings: { isDemo: true, name: cfg.name } as object,
      },
    });

    const userByEmail = new Map<string, { id: string }>();

    for (const m of cfg.members) {
      const hash = m.email === cfg.adminEmail ? passwordAdmin : passwordDemo;
      const user = await prisma.user.upsert({
        where: { email: m.email },
        create: {
          email: m.email,
          name: m.name,
          passwordHash: hash,
          isActive: true,
        },
        update: {
          name: m.name,
          passwordHash: hash,
          isActive: true,
        },
      });
      await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: m.role,
          department: m.department,
        },
        update: {
          role: m.role,
          department: m.department,
        },
      });
      userByEmail.set(m.email, { id: user.id });
    }

    const competencyBundles = await seedCompetenciesAndActions(org.id, cfg.name);
    const competencyKeys = ["communication", "leadership", "collaboration"];

    await seed360(org.id, userByEmail, competencyKeys, cfg.patterns360, cfg.name, cfg.adminEmail);

    const iqTid = await seedIqTemplate(org.id, cfg.name, cfg.iqKeyPrefix);
    const eqTid = await seedEqTemplate(org.id, cfg.name);
    const psychTid = await seedPsychTemplate(org.id, cfg.name);

    await seedIqDemo(org.id, userByEmail, iqTid, { demo: cfg.demoEmail, eng2: cfg.eng2Email });
    await seedEqDemo(org.id, userByEmail, eqTid, cfg.demoEmail);
    await seedPsychInProgress(org.id, userByEmail, psychTid, cfg.psychParticipantEmail);
    await seedManualActions(org.id, userByEmail, competencyBundles, cfg.manualPairs);
  }

  await seedGlobalDemoTrainingContentTemplates();
}
