/**
 * Seeds a demo IQ bank (template + 5 questions) into the first organization.
 * Run: `npx prisma db seed` (requires DATABASE_URL and applied migrations).
 */
import { Prisma } from "../src/generated/prisma/client";
import prisma from "../src/lib/prisma";
import {
  AssessmentQuestionType,
  AssessmentTemplateType,
  ScoringStrategy,
} from "../src/generated/prisma/enums";

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { name: "asc" } });
  if (!org) {
    console.warn("No organization found — create an org in Super Admin first.");
    return;
  }

  const template = await prisma.assessmentTemplate.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "iq-sample-bank" } },
    create: {
      organizationId: org.id,
      type: AssessmentTemplateType.IQ_COGNITIVE,
      key: "iq-sample-bank",
      name: "Sample IQ bank (Phase 7 demo)",
      description: "Five demo items with pooling; adjust config in Super Admin as needed.",
      scoringStrategy: ScoringStrategy.SUM_CORRECT,
      config: {
        questionsPerTest: 5,
        totalTimeSeconds: 1800,
        defaultQuestionTimeSeconds: 90,
        retakeCooldownMonths: 6,
        passingStandardScore: 100,
      },
      sortOrder: 10,
      isActive: true,
    },
    update: {
      name: "Sample IQ bank (Phase 7 demo)",
      config: {
        questionsPerTest: 5,
        totalTimeSeconds: 1800,
        defaultQuestionTimeSeconds: 90,
        retakeCooldownMonths: 6,
        passingStandardScore: 100,
      },
    },
  });

  type Item = {
    key: string;
    questionType: AssessmentQuestionType;
    prompt: string;
    options: { id: string; label: string }[];
    correctId: string;
  };

  const items: Item[] = [
    {
      key: "iq_n1",
      questionType: AssessmentQuestionType.NUMERICAL_SEQUENCE,
      prompt: "What number comes next? 1, 3, 5, 7, ?",
      options: [
        { id: "opt_0", label: "8" },
        { id: "opt_1", label: "9" },
        { id: "opt_2", label: "10" },
        { id: "opt_3", label: "11" },
      ],
      correctId: "opt_1",
    },
    {
      key: "iq_n2",
      questionType: AssessmentQuestionType.NUMERICAL_SEQUENCE,
      prompt: "2, 4, 8, 16, ?",
      options: [
        { id: "opt_0", label: "24" },
        { id: "opt_1", label: "32" },
        { id: "opt_2", label: "40" },
        { id: "opt_3", label: "64" },
      ],
      correctId: "opt_1",
    },
    {
      key: "iq_l1",
      questionType: AssessmentQuestionType.LOGICAL_PATTERN,
      prompt: "All roses are flowers. All flowers fade. Which must be true?",
      options: [
        { id: "opt_0", label: "All roses fade." },
        { id: "opt_1", label: "Only roses fade." },
        { id: "opt_2", label: "Nothing fades." },
        { id: "opt_3", label: "Some flowers are not roses." },
      ],
      correctId: "opt_0",
    },
    {
      key: "iq_l2",
      questionType: AssessmentQuestionType.LOGICAL_PATTERN,
      prompt: "If it rains, the ground is wet. The ground is not wet. What follows?",
      options: [
        { id: "opt_0", label: "It is raining." },
        { id: "opt_1", label: "It is not raining." },
        { id: "opt_2", label: "The ground dried instantly." },
        { id: "opt_3", label: "Nothing can be concluded." },
      ],
      correctId: "opt_1",
    },
    {
      key: "iq_v1",
      questionType: AssessmentQuestionType.VERBAL_ANALOGY,
      prompt: "Cat is to Kitten as Dog is to ?",
      options: [
        { id: "opt_0", label: "Hound" },
        { id: "opt_1", label: "Puppy" },
        { id: "opt_2", label: "Wolf" },
        { id: "opt_3", label: "Pack" },
      ],
      correctId: "opt_1",
    },
  ];

  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const config = {
      prompt: it.prompt,
      type: "single_choice" as const,
      options: it.options.map((o) => ({ ...o, value: o.label })),
      assessmentQuestionType: it.questionType,
    };

    await prisma.question.upsert({
      where: { templateId_key: { templateId: template.id, key: it.key } },
      create: {
        organizationId: org.id,
        templateId: template.id,
        key: it.key,
        questionType: it.questionType,
        config,
        correctOptionId: it.correctId,
        weight: new Prisma.Decimal(1),
        timeLimitSeconds: 90,
        sortOrder: i,
        isActive: true,
      },
      update: {
        questionType: it.questionType,
        config,
        correctOptionId: it.correctId,
        weight: new Prisma.Decimal(1),
        timeLimitSeconds: 90,
        sortOrder: i,
        isActive: true,
      },
    });
  }

  console.log(`Seeded IQ template "${template.name}" (${template.id}) with ${items.length} questions on org ${org.slug}.`);

  const eqTemplate = await prisma.assessmentTemplate.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "eq-sample-bank" } },
    create: {
      organizationId: org.id,
      type: AssessmentTemplateType.EQ_ASSESSMENT,
      key: "eq-sample-bank",
      name: "Sample EQ (Phase 8 demo)",
      description: "Ten items — two per Goleman domain (scenario + self-report).",
      scoringStrategy: ScoringStrategy.TRAIT_AGGREGATE,
      config: {},
      sortOrder: 11,
      isActive: true,
    },
    update: {
      name: "Sample EQ (Phase 8 demo)",
      description: "Ten items — two per Goleman domain (scenario + self-report).",
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
      await prisma.question.upsert({
        where: { templateId_key: { templateId: eqTemplate.id, key: it.key } },
        create: {
          organizationId: org.id,
          templateId: eqTemplate.id,
          key: it.key,
          questionType: AssessmentQuestionType.EQ_SCENARIO,
          config,
          traitCategory: it.domain,
          weight: new Prisma.Decimal(1),
          sortOrder: i,
          isActive: true,
          reverseScored: false,
        },
        update: {
          questionType: AssessmentQuestionType.EQ_SCENARIO,
          config,
          traitCategory: it.domain,
          sortOrder: i,
          isActive: true,
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
      await prisma.question.upsert({
        where: { templateId_key: { templateId: eqTemplate.id, key: it.key } },
        create: {
          organizationId: org.id,
          templateId: eqTemplate.id,
          key: it.key,
          questionType: AssessmentQuestionType.EQ_SELF_REPORT,
          config,
          traitCategory: it.domain,
          weight: new Prisma.Decimal(1),
          sortOrder: i,
          isActive: true,
          reverseScored: Boolean(it.reverse),
        },
        update: {
          questionType: AssessmentQuestionType.EQ_SELF_REPORT,
          config,
          traitCategory: it.domain,
          reverseScored: Boolean(it.reverse),
          sortOrder: i,
          isActive: true,
        },
      });
    }
  }

  console.log(
    `Seeded EQ template "${eqTemplate.name}" (${eqTemplate.id}) with ${eqItems.length} questions on org ${org.slug}.`,
  );

  const psychTemplate = await prisma.assessmentTemplate.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "psych-big-five-mini" } },
    create: {
      organizationId: org.id,
      type: AssessmentTemplateType.PSYCHOMETRIC,
      key: "psych-big-five-mini",
      name: "Big Five mini (Phase 9 demo)",
      description: "Fifteen forced-choice ipsative items (three per Big Five dimension).",
      scoringStrategy: ScoringStrategy.TRAIT_AGGREGATE,
      config: {
        itemsPerPage: 5,
        retakeCooldownMonths: 12,
        roleProfiles: {
          leadership: {
            Openness: 0.55,
            Conscientiousness: 0.72,
            Extraversion: 0.68,
            Agreeableness: 0.65,
            Neuroticism: 0.28,
          },
          sales: {
            Extraversion: 0.78,
            Conscientiousness: 0.7,
            Agreeableness: 0.62,
            Openness: 0.45,
            Neuroticism: 0.35,
          },
          creative: {
            Openness: 0.85,
            Conscientiousness: 0.35,
            Extraversion: 0.55,
            Agreeableness: 0.65,
            Neuroticism: 0.45,
          },
        },
      },
      sortOrder: 12,
      isActive: true,
    },
    update: {
      name: "Big Five mini (Phase 9 demo)",
      description: "Fifteen forced-choice ipsative items (three per Big Five dimension).",
      config: {
        itemsPerPage: 5,
        retakeCooldownMonths: 12,
        roleProfiles: {
          leadership: {
            Openness: 0.55,
            Conscientiousness: 0.72,
            Extraversion: 0.68,
            Agreeableness: 0.65,
            Neuroticism: 0.28,
          },
          sales: {
            Extraversion: 0.78,
            Conscientiousness: 0.7,
            Agreeableness: 0.62,
            Openness: 0.45,
            Neuroticism: 0.35,
          },
          creative: {
            Openness: 0.85,
            Conscientiousness: 0.35,
            Extraversion: 0.55,
            Agreeableness: 0.65,
            Neuroticism: 0.45,
          },
        },
      },
    },
  });

  type PsychTriad = {
    key: string;
    statements: { id: string; text: string; trait: string }[];
  };

  const psychTriads: PsychTriad[] = [
    {
      key: "psych_fc_01",
      statements: [
        { id: "s0", text: "I enjoy exploring new ideas and unfamiliar topics.", trait: "Openness" },
        { id: "s1", text: "I follow through on commitments and meet deadlines.", trait: "Conscientiousness" },
        { id: "s2", text: "I feel energized in lively group settings.", trait: "Extraversion" },
      ],
    },
    {
      key: "psych_fc_02",
      statements: [
        { id: "s0", text: "I try to see others’ points of view before deciding.", trait: "Agreeableness" },
        { id: "s1", text: "I often notice tension or worry before others do.", trait: "Neuroticism" },
        { id: "s2", text: "I like experimenting with different ways of doing things.", trait: "Openness" },
      ],
    },
    {
      key: "psych_fc_03",
      statements: [
        { id: "s0", text: "I keep my workspace and tasks organized.", trait: "Conscientiousness" },
        { id: "s1", text: "I speak up readily in meetings.", trait: "Extraversion" },
        { id: "s2", text: "I assume people mean well until proven otherwise.", trait: "Agreeableness" },
      ],
    },
    {
      key: "psych_fc_04",
      statements: [
        { id: "s0", text: "My mood can shift when pressure builds.", trait: "Neuroticism" },
        { id: "s1", text: "I seek out novel experiences when I can.", trait: "Openness" },
        { id: "s2", text: "I plan ahead rather than leaving things to chance.", trait: "Conscientiousness" },
      ],
    },
    {
      key: "psych_fc_05",
      statements: [
        { id: "s0", text: "I recharge with people rather than alone.", trait: "Extraversion" },
        { id: "s1", text: "I prioritize harmony even when it takes extra effort.", trait: "Agreeableness" },
        { id: "s2", text: "I sometimes dwell on things I wish I had done differently.", trait: "Neuroticism" },
      ],
    },
    {
      key: "psych_fc_06",
      statements: [
        { id: "s0", text: "I enjoy abstract or creative brainstorming.", trait: "Openness" },
        { id: "s1", text: "I rely on checklists and routines.", trait: "Conscientiousness" },
        { id: "s2", text: "I am comfortable being direct and assertive.", trait: "Extraversion" },
      ],
    },
    {
      key: "psych_fc_07",
      statements: [
        { id: "s0", text: "I try to help others even when it is inconvenient.", trait: "Agreeableness" },
        { id: "s1", text: "I stay calmer than most when plans change suddenly.", trait: "Neuroticism" },
        { id: "s2", text: "I like learning skills outside my main role.", trait: "Openness" },
      ],
    },
    {
      key: "psych_fc_08",
      statements: [
        { id: "s0", text: "I finish tasks before starting new ones.", trait: "Conscientiousness" },
        { id: "s1", text: "I enjoy hosting or being at social events.", trait: "Extraversion" },
        { id: "s2", text: "I give others the benefit of the doubt.", trait: "Agreeableness" },
      ],
    },
    {
      key: "psych_fc_09",
      statements: [
        { id: "s0", text: "I am sensitive to criticism or setbacks.", trait: "Neuroticism" },
        { id: "s1", text: "I question assumptions and look for better approaches.", trait: "Openness" },
        { id: "s2", text: "I track details carefully on important work.", trait: "Conscientiousness" },
      ],
    },
    {
      key: "psych_fc_10",
      statements: [
        { id: "s0", text: "I prefer working with others over solo deep work.", trait: "Extraversion" },
        { id: "s1", text: "I avoid conflict when I can resolve it cooperatively.", trait: "Agreeableness" },
        { id: "s2", text: "Stress sometimes affects my sleep or focus.", trait: "Neuroticism" },
      ],
    },
    {
      key: "psych_fc_11",
      statements: [
        { id: "s0", text: "I enjoy art, ideas, or intellectual debate.", trait: "Openness" },
        { id: "s1", text: "I am punctual and dependable.", trait: "Conscientiousness" },
        { id: "s2", text: "I take charge when a group needs direction.", trait: "Extraversion" },
      ],
    },
    {
      key: "psych_fc_12",
      statements: [
        { id: "s0", text: "I trust teammates unless given a reason not to.", trait: "Agreeableness" },
        { id: "s1", text: "I bounce back quickly after bad news.", trait: "Neuroticism" },
        { id: "s2", text: "I like variety more than repeating the same tasks.", trait: "Openness" },
      ],
    },
    {
      key: "psych_fc_13",
      statements: [
        { id: "s0", text: "I break large goals into steps and milestones.", trait: "Conscientiousness" },
        { id: "s1", text: "I network and build rapport easily.", trait: "Extraversion" },
        { id: "s2", text: "I look for compromise when people disagree.", trait: "Agreeableness" },
      ],
    },
    {
      key: "psych_fc_14",
      statements: [
        { id: "s0", text: "I worry about things that might go wrong.", trait: "Neuroticism" },
        { id: "s1", text: "I enjoy trying tools or methods I have not used before.", trait: "Openness" },
        { id: "s2", text: "I keep promises even when no one is checking.", trait: "Conscientiousness" },
      ],
    },
    {
      key: "psych_fc_15",
      statements: [
        { id: "s0", text: "I feel comfortable in the spotlight.", trait: "Extraversion" },
        { id: "s1", text: "I listen and validate before offering my view.", trait: "Agreeableness" },
        { id: "s2", text: "I stay even-keel when others are stressed.", trait: "Neuroticism" },
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

    await prisma.question.upsert({
      where: { templateId_key: { templateId: psychTemplate.id, key: it.key } },
      create: {
        organizationId: org.id,
        templateId: psychTemplate.id,
        key: it.key,
        questionType: AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
        config,
        traitCategory: null,
        weight: new Prisma.Decimal(1),
        sortOrder: i,
        isActive: true,
        reverseScored: false,
      },
      update: {
        questionType: AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
        config,
        sortOrder: i,
        isActive: true,
      },
    });
  }

  console.log(
    `Seeded psychometric template "${psychTemplate.name}" (${psychTemplate.id}) with ${psychTriads.length} questions on org ${org.slug}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
