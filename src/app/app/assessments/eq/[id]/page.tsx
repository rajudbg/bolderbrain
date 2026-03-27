import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EqAttemptStatus } from "@/generated/prisma/enums";
import { getEqAttemptPayload } from "../actions";
import { EqTestClient } from "./eq-test-client";

export default async function EqTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getEqAttemptPayload(id);
  if (payload) {
    return (
      <EqTestClient
        attemptId={payload.attempt.id}
        templateName={payload.attempt.templateName}
        sections={payload.sections}
        initialResponses={payload.attempt.responses}
        initialSectionIndex={payload.attempt.currentSectionIndex}
      />
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/app/assessments/eq/${id}`)}`);
  }

  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  const row = await prisma.eqTestAttempt.findFirst({
    where: { id, userId: session.user.id, organizationId: { in: orgIds } },
    include: { result: true },
  });
  if (row?.status === EqAttemptStatus.COMPLETED && row.result) {
    redirect(`/app/assessments/eq/${id}/results`);
  }

  redirect("/app/assessments/eq");
}
