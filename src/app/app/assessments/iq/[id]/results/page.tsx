import Link from "next/link";
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8">
      <Link href="/app/dashboard" className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors">
        ← Dashboard
      </Link>
      <IqResultsView
        templateName={payload.templateName}
        passingStandardScore={payload.passingStandardScore}
        result={payload.result}
      />
    </div>
  );
}
