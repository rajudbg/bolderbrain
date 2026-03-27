import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { TrainingResultsClient } from "./results-client";

export default async function TrainingResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/app/training");

  const { id: programId } = await params;
  const orgIds = session.user.tenants.map((t) => t.organizationId);

  const enrollment = await prisma.trainingEnrollment.findFirst({
    where: {
      trainingProgramId: programId,
      userId: session.user.id,
      trainingProgram: { organizationId: { in: orgIds } },
    },
    include: {
      trainingProgram: {
        select: {
          name: true,
          trainingContentTemplate: { select: { kind: true } },
        },
      },
    },
  });

  if (!enrollment) notFound();

  const delta = enrollment.delta as import("@/lib/training-impact").TrainingDeltaPayload | null;
  const kind = enrollment.trainingProgram.trainingContentTemplate?.kind;
  const measurement =
    kind === "KNOWLEDGE_TEST" ? ("knowledge_percent" as const) : ("likert_scale" as const);

  return (
    <TrainingResultsClient programName={enrollment.trainingProgram.name} delta={delta} measurement={measurement} />
  );
}
