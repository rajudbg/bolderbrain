import { AssessmentTemplateType } from "@/generated/prisma/enums";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import { Launch360ReviewForm } from "../_components/launch-360-review-form";

export default async function AdminLaunch360Page() {
  const orgId = await requireAdminOrganizationId();

  const [org, templates, members] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true },
    }),
    prisma.assessmentTemplate.findMany({
      where: {
        organizationId: orgId,
        type: AssessmentTemplateType.BEHAVIORAL_360,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, key: true, name: true, description: true },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { email: "asc" } },
    }),
  ]);

  if (!org) {
    return null;
  }

  return (
    <Launch360ReviewForm
      organizationName={org.name}
      templates={templates}
      members={members.map((m) => ({ userId: m.userId, user: m.user }))}
    />
  );
}
