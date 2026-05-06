import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { QuestionsClient } from "./_components/questions-client";
import type { QuestionDTO } from "./_components/question-form-dialog";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; templateId?: string }>;
}) {
  await requirePlatformSuperAdmin();
  const { orgId, templateId } = await searchParams;

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const templateOptions = orgId
    ? await prisma.assessmentTemplate.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
        select: { id: true, key: true, name: true, type: true },
      })
    : [];

  const questions = orgId
    ? await prisma.question.findMany({
        where: {
          organizationId: orgId,
          ...(templateId ? { templateId } : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
        include: {
          template: { select: { name: true, key: true, type: true } },
        },
      })
    : [];

  const dto: QuestionDTO[] = questions.map((q) => ({
    id: q.id,
    organizationId: q.organizationId,
    templateId: q.templateId,
    key: q.key,
    questionType: q.questionType,
    config: q.config,
    correctOptionId: q.correctOptionId,
    traitCategory: q.traitCategory,
    weight: q.weight ? Number(q.weight) : null,
    timeLimitSeconds: q.timeLimitSeconds,
    reverseScored: q.reverseScored,
    sortOrder: q.sortOrder,
    isActive: q.isActive,
    template: q.template,
  }));

  return (
    <QuestionsClient
      organizations={organizations}
      templateOptions={templateOptions}
      questions={dto}
      selectedOrgId={orgId ?? null}
      selectedTemplateId={templateId ?? null}
    />
  );
}
