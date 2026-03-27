import { notFound } from "next/navigation";
import { getTrainingProgram } from "../actions";
import { TrainingProgramDashboard } from "./training-program-dashboard";

export default async function TrainingProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getTrainingProgram(id);
  if (!program) notFound();

  return <TrainingProgramDashboard program={program} />;
}
