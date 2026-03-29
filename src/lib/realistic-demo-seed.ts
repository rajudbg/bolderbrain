import bcrypt from "bcryptjs";
import {
  OrganizationRole,
  TrainingNeedSource,
  TrainingNeedStatus,
} from "@/generated/prisma/enums";
import { DEMO_ORG_SLUG } from "@/lib/demo-constants";
import { gapSeverityFromGap, priorityFromGap } from "@/lib/tna/gaps";
import prisma from "@/lib/prisma";

const PASSWORD_DEMO = "demo123";

/** Additional Acme employees to mimic a mid-size product company (idempotent by email). */
const EXTRA_ACME_EMPLOYEES: Array<{
  email: string;
  name: string;
  department: string;
  role: OrganizationRole;
}> = [
  { email: "james.chen@acme.com", name: "James Chen", department: "Product", role: OrganizationRole.EMPLOYEE },
  { email: "priya.nair@acme.com", name: "Priya Nair", department: "Product", role: OrganizationRole.EMPLOYEE },
  { email: "marcus.webb@acme.com", name: "Marcus Webb", department: "Product", role: OrganizationRole.EMPLOYEE },
  { email: "elena.vargas@acme.com", name: "Elena Vargas", department: "Design", role: OrganizationRole.EMPLOYEE },
  { email: "noah.kim@acme.com", name: "Noah Kim", department: "Design", role: OrganizationRole.EMPLOYEE },
  { email: "sofia.alvarez@acme.com", name: "Sofia Alvarez", department: "Marketing", role: OrganizationRole.EMPLOYEE },
  { email: "daniel.ross@acme.com", name: "Daniel Ross", department: "Marketing", role: OrganizationRole.EMPLOYEE },
  { email: "amara.okonkwo@acme.com", name: "Amara Okonkwo", department: "HR", role: OrganizationRole.EMPLOYEE },
  { email: "viktor.petrov@acme.com", name: "Viktor Petrov", department: "Finance", role: OrganizationRole.EMPLOYEE },
  { email: "hannah.berg@acme.com", name: "Hannah Berg", department: "Finance", role: OrganizationRole.EMPLOYEE },
  { email: "omar.hassan@acme.com", name: "Omar Hassan", department: "Customer Success", role: OrganizationRole.EMPLOYEE },
  { email: "lucy.morgan@acme.com", name: "Lucy Morgan", department: "Customer Success", role: OrganizationRole.EMPLOYEE },
  { email: "diego.morales@acme.com", name: "Diego Morales", department: "Operations", role: OrganizationRole.EMPLOYEE },
  { email: "yuki.tanaka@acme.com", name: "Yuki Tanaka", department: "Operations", role: OrganizationRole.EMPLOYEE },
  { email: "fatima.rahman@acme.com", name: "Fatima Rahman", department: "Legal", role: OrganizationRole.EMPLOYEE },
  { email: "oliver.stone@acme.com", name: "Oliver Stone", department: "Data & Analytics", role: OrganizationRole.EMPLOYEE },
  { email: "mei.lin@acme.com", name: "Mei Lin", department: "Data & Analytics", role: OrganizationRole.EMPLOYEE },
  { email: "andre.silva@acme.com", name: "André Silva", department: "Engineering", role: OrganizationRole.EMPLOYEE },
  { email: "rachel.cohen@acme.com", name: "Rachel Cohen", department: "Engineering", role: OrganizationRole.EMPLOYEE },
  { email: "kenji.sato@acme.com", name: "Kenji Sato", department: "Engineering", role: OrganizationRole.EMPLOYEE },
  { email: "natalie.brooks@acme.com", name: "Natalie Brooks", department: "Sales", role: OrganizationRole.EMPLOYEE },
  { email: "ivan.kowalski@acme.com", name: "Ivan Kowalski", department: "Sales", role: OrganizationRole.EMPLOYEE },
  { email: "chloe.aubert@acme.com", name: "Chloe Aubert", department: "Leadership", role: OrganizationRole.ADMIN },
];

/**
 * Enriches the primary demo org (default: acme-demo) with a larger roster, org metadata,
 * synthetic skills inventory, and sample training needs — safe to run multiple times.
 */
export async function seedRealisticWorkforceData(orgSlug: string = DEMO_ORG_SLUG): Promise<{ message: string }> {
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    throw new Error(`Organization "${orgSlug}" not found. Run npm run seed:demo first.`);
  }

  const hash = await bcrypt.hash(PASSWORD_DEMO, 10);

  const existingSettings = (org.settings && typeof org.settings === "object" ? org.settings : {}) as Record<
    string,
    unknown
  >;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      settings: {
        ...existingSettings,
        industry: "Enterprise Software & Services",
        employeeCountBand: "500–1,000",
        headquarters: "San Francisco, CA",
        realisticSeedVersion: 1,
      } as object,
    },
  });

  const competencies = await prisma.competency.findMany({
    where: { organizationId: org.id, isActive: true },
    select: { id: true, key: true, name: true },
  });
  if (competencies.length === 0) {
    throw new Error("No competencies in org — run seed:demo first.");
  }

  const compByKey = new Map(competencies.map((c) => [c.key, c]));

  const extraEmails = EXTRA_ACME_EMPLOYEES.map((e) => e.email);
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: extraEmails } },
    select: { id: true },
  });
  const existingIds = existingUsers.map((u) => u.id);
  if (existingIds.length > 0) {
    await prisma.trainingNeed.deleteMany({
      where: { organizationId: org.id, userId: { in: existingIds }, notes: { contains: "[realistic-seed]" } },
    });
    await prisma.skillsInventory.deleteMany({
      where: { organizationId: org.id, userId: { in: existingIds } },
    });
  }

  const userIds: string[] = [];

  for (const row of EXTRA_ACME_EMPLOYEES) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      create: {
        email: row.email,
        name: row.name,
        passwordHash: hash,
        isActive: true,
      },
      update: {
        name: row.name,
        passwordHash: hash,
        isActive: true,
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: org.id },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: row.role,
        department: row.department,
      },
      update: {
        role: row.role,
        department: row.department,
      },
    });

    userIds.push(user.id);
  }

  const keys = ["communication", "leadership", "collaboration"] as const;
  let seed = 0;
  for (const userId of userIds) {
    for (const key of keys) {
      const c = compByKey.get(key);
      if (!c) continue;
      seed += 7;
      const targetScore = 4.0 + (seed % 5) * 0.05;
      const currentScore = 2.4 + ((seed * 13) % 23) / 10;
      const gap = Math.max(0, targetScore - currentScore);
      const severity = gapSeverityFromGap(gap);

      await prisma.skillsInventory.upsert({
        where: {
          userId_organizationId_competencyId: {
            userId,
            organizationId: org.id,
            competencyId: c.id,
          },
        },
        create: {
          organizationId: org.id,
          userId,
          competencyId: c.id,
          currentScore,
          targetScore,
          gap,
          severity,
          gapCountHint: gap > 0.5 ? 1 : 0,
        },
        update: {
          currentScore,
          targetScore,
          gap,
          severity,
          gapCountHint: gap > 0.5 ? 1 : 0,
        },
      });
    }
  }

  const needStatuses: TrainingNeedStatus[] = [
    TrainingNeedStatus.OPEN,
    TrainingNeedStatus.ASSIGNED,
    TrainingNeedStatus.IN_PROGRESS,
  ];
  const needSources: TrainingNeedSource[] = [
    TrainingNeedSource.TNA_ASSESSMENT,
    TrainingNeedSource.MANAGER_NOMINATION,
    TrainingNeedSource.SELF_IDENTIFIED,
  ];

  let ni = 0;
  for (const userId of userIds.slice(0, 12)) {
    const c = competencies[ni % competencies.length]!;
    ni++;
    const currentScore = 2.8 + (ni % 10) / 10;
    const targetScore = 4.2;
    const gap = targetScore - currentScore;
    if (gap <= 0) continue;

    await prisma.trainingNeed.create({
      data: {
        organizationId: org.id,
        userId,
        competencyId: c.id,
        currentScore,
        targetScore,
        gap,
        priority: priorityFromGap(gap),
        source: needSources[ni % needSources.length]!,
        status: needStatuses[ni % needStatuses.length]!,
        notes: "[realistic-seed] Sample development need for HR analytics demos.",
      },
    });
  }

  return {
    message: `Realistic data: ${userIds.length} employees upserted for ${orgSlug}; skills inventory + sample training needs refreshed.`,
  };
}
