import { redirect } from "next/navigation";
import { getIqResultPayload } from "../../actions";
import { IqResultsView } from "./iq-results-view";

export default async function IqResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getIqResultPayload(id);
  if (!payload) {
    redirect("/app/assessments/iq");
  }

  return (
    <IqResultsView
      templateName={payload.templateName}
      passingStandardScore={payload.passingStandardScore}
      result={payload.result}
    />
  );
}
