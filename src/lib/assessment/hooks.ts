import { revalidatePath } from "next/cache";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import { generateAndPersist360AIInsight } from "@/lib/ai/insights";

/**
 * Runs after a 360 assessment result is finalized: Nemotron insight + smart actions, with rule fallback.
 */
export async function onAssessment360CompletedForAi(input: {
  assessmentId: string;
  subjectUserId: string;
  organizationId: string;
  scores: Assessment360StoredResult;
}): Promise<void> {
  await generateAndPersist360AIInsight({
    userId: input.subjectUserId,
    assessmentId: input.assessmentId,
    organizationId: input.organizationId,
    scores: input.scores,
  });
  revalidatePath("/app");
  revalidatePath("/app/dashboard");
}
