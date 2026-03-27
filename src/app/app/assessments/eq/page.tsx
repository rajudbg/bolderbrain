import { listEqTemplatesForUser } from "./actions";
import { EqStartClient } from "./eq-start-client";

export default async function EqAssessmentsPage() {
  const templates = await listEqTemplatesForUser();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8">
      <header className="space-y-2">
        <p className="text-caption-cerebral text-[10px] text-amber-200/80">Emotional intelligence</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-4xl">
          EQ assessments
        </h1>
        <p className="max-w-2xl text-sm text-white/55">
          There is no pass or fail — these items are for reflection and growth. Take your time; your progress saves
          automatically so you can resume anytime.
        </p>
      </header>
      <EqStartClient templates={templates} />
    </div>
  );
}
