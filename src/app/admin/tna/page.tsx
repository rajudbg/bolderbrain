import { getTnaDashboardSnapshot } from "./actions";
import { TnaDashboardClient } from "./tna-dashboard-client";

export default async function AdminTnaPage() {
  const snap = await getTnaDashboardSnapshot();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-3xl">
          Training needs analysis
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">
          Identify gaps across skills inventory, prioritize critical needs, assign programs, and close the loop after
          post-training assessments.
        </p>
      </div>

      <TnaDashboardClient
        needs={snap.needs}
        inventory={snap.inventory}
        competencies={snap.competencies}
        programs={snap.programs}
        criticalQueue={snap.criticalQueue}
        summaryPct={snap.summaryPct}
        memberCount={snap.memberCount}
      />
    </div>
  );
}
