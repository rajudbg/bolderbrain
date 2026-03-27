import { listIqTemplatesForUser } from "./actions";
import { IqStartClient } from "./iq-start-client";

export default async function IqAssessmentsPage() {
  const templates = await listIqTemplatesForUser();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Cognitive</p>
        <h1 className="text-3xl font-semibold tracking-tight">IQ / cognitive assessments</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Timed, single-session tests. Questions are drawn at random from your organization&apos;s bank. Results are available immediately after you submit.
        </p>
      </header>
      <IqStartClient templates={templates} />
    </div>
  );
}
