import { getTnaDashboardSnapshot } from "../../tna/actions";
import { TnaDashboardClient } from "../../tna/tna-dashboard-client";

export default async function AdminTeamDevelopmentPage() {
  const snap = await getTnaDashboardSnapshot();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-3xl">
          Team development
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">
          Skills matrix heatmap for your organization. Spot systemic gaps (e.g. several people low on the same
          competency) and plan cohort workshops.
        </p>
      </div>

      <TnaDashboardClient
        teamMode
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
