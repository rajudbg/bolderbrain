import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { TemplatesClient } from "./_components/templates-client";
import type { AssessmentTemplateDTO } from "./_components/template-form-dialog";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  await requirePlatformSuperAdmin();
  const { orgId } = await searchParams;

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const templates = orgId
    ? await prisma.assessmentTemplate.findMany({
        where: { organizationId: orgId },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { organization: { select: { name: true, slug: true } } },
      })
    : [];

  const dto: (AssessmentTemplateDTO & { organization: { name: string; slug: string } })[] = templates.map((t) => ({
    id: t.id,
    organizationId: t.organizationId,
    type: t.type,
    scoringStrategy: t.scoringStrategy,
    key: t.key,
    name: t.name,
    description: t.description,
    config: t.config,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
    organization: t.organization,
  }));

  return <TemplatesClient organizations={organizations} templates={dto} selectedOrgId={orgId ?? null} />;
}
