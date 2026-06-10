import { redirect } from "next/navigation";
import { getEqResultPayload } from "../../actions";
import { EqResultsView } from "./eq-results-view";
import { ResultsCTA } from "@/components/app-shell/results-cta";

export default async function EqResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getEqResultPayload(id);
  if (!payload) redirect("/app/assessments/eq");

  return (
    <>
      <EqResultsView
        templateName={payload.templateName}
        submittedAt={payload.submittedAt}
        result={payload.result}
      />
      <ResultsCTA />
    </>
  );
}
