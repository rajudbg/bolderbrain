import { notFound, redirect } from "next/navigation";
import { getTrainingAttemptForUser } from "../../training-attempt-actions";
import { TrainingAttemptClient } from "./attempt-client";

export default async function TrainingAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const view = await getTrainingAttemptForUser(attemptId);
  if (!view) notFound();

  if (view.submittedAt) {
    redirect(`/app/training/${view.programId}/results`);
  }

  return <TrainingAttemptClient initial={view} />;
}
