import { notFound } from "next/navigation";
import { getTakingPayload } from "../actions";
import { AssessmentTakingClient } from "./assessment-taking-client";

export default async function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ evaluatorId: string }>;
}) {
  const { evaluatorId } = await params;
  const payload = await getTakingPayload(evaluatorId);
  if (!payload) notFound();

  return <AssessmentTakingClient initial={payload} />;
}
