import { listPsychTemplatesForUser } from "./actions";
import { PsychStartClient } from "./psych-start-client";

export default async function PsychAssessmentsPage() {
  const templates = await listPsychTemplatesForUser();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-violet-700 uppercase dark:text-violet-400">
          Personality (Big Five)
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Psychometric assessments</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          This is not a grade — it is a snapshot of tendencies. There is no time limit; progress saves automatically so you
          can pause and return.
        </p>
      </header>
      <PsychStartClient templates={templates} />
    </div>
  );
}
