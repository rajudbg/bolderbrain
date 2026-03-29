import prisma from "@/lib/prisma";

/** Pick best matching CompetencyTarget (specific department beats org-wide). */
export async function resolveTargetForCompetency(
  organizationId: string,
  competencyId: string,
  department: string | null,
) {
  const rows = await prisma.competencyTarget.findMany({
    where: { organizationId, competencyId },
  });
  if (rows.length === 0) return null;

  const dept = department?.trim() || null;
  const specific = dept ? rows.find((r) => r.department?.trim() === dept) : undefined;
  if (specific) return specific;

  const orgWide = rows.find((r) => !r.department?.trim());
  return orgWide ?? rows[0] ?? null;
}
