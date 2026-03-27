import { redirect } from "next/navigation";
import { getPsychResultPayload } from "../../actions";
import { PsychResultsView } from "./psych-results-view";

export default async function PsychResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPsychResultPayload(id);
  if (!payload) redirect("/app/assessments/psychometric");

  return (
    <PsychResultsView
      templateName={payload.templateName}
      submittedAt={payload.submittedAt}
      result={payload.result}
      roleProfileKeys={payload.roleProfileKeys}
    />
  );
}
