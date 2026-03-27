import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getIqAttemptPayload } from "../actions";
import { IqTestClient } from "./iq-test-client";

export default async function IqTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getIqAttemptPayload(id);
  if (payload) {
    return <IqTestClient payload={payload} />;
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/app/assessments/iq/${id}`)}`);
  }

  const orgIds = (session.user.tenants ?? []).map((t) => t.organizationId);
  const row = await prisma.iqTestAttempt.findFirst({
    where: { id, userId: session.user.id, organizationId: { in: orgIds } },
    include: { result: true },
  });
  if (row?.result) {
    redirect(`/app/assessments/iq/${id}/results`);
  }

  redirect("/app/assessments/iq");
}
