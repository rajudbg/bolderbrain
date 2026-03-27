import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PsychAttemptStatus } from "@/generated/prisma/enums";
import { getPsychAttemptPayload } from "../actions";
import { PsychTestClient } from "./psych-test-client";

export default async function PsychTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPsychAttemptPayload(id);
  if (payload) {
    return (
      <PsychTestClient
        attemptId={payload.attempt.id}
        templateName={payload.attempt.templateName}
        itemsPerPage={payload.attempt.itemsPerPage}
        initialQuestionIndex={payload.attempt.currentQuestionIndex}
        questionCount={payload.attempt.questionCount}
        questions={payload.questions}
        initialResponses={payload.attempt.responses}
        initialItemTimings={payload.attempt.itemTimings}
      />
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/app/assessments/psychometric/${id}`)}`);
  }

  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  const row = await prisma.psychTestAttempt.findFirst({
    where: { id, userId: session.user.id, organizationId: { in: orgIds } },
    include: { result: true },
  });
  if (row?.status === PsychAttemptStatus.COMPLETED && row.result) {
    redirect(`/app/assessments/psychometric/${id}/results`);
  }

  redirect("/app/assessments/psychometric");
}
