import { redirect } from "next/navigation";
import { getManagerTeamPayload } from "@/lib/manager-dashboard";
import { ManagerCompetencyHeatmapChart } from "./_components/manager-competency-heatmap-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, CheckCircle2, AlertCircle } from "lucide-react";

export default async function ManagerDashboardPage() {
  const data = await getManagerTeamPayload();
  if (!data) redirect("/login");

  const { teamMembers, aggregatedStats, competencyHeatmap, department, organizationName } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Manager</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Team Dashboard
        </h1>
        <p className="text-body-cerebral max-w-2xl">
          {organizationName}
          {department && <span className="text-white/50"> · {department}</span>}
          <span className="text-white/50"> · {teamMembers.length} direct reports</span>
        </p>
      </header>

      {/* Aggregated Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Size"
          value={String(teamMembers.length)}
          icon={Users}
          trend={null}
        />
        <StatCard
          title="Avg Competency"
          value={aggregatedStats.avgCompetencyScore.toFixed(1)}
          icon={Target}
          trend={aggregatedStats.avgCompetencyScore > 3.5 ? "up" : aggregatedStats.avgCompetencyScore < 2.5 ? "down" : null}
        />
        <StatCard
          title="Action Rate"
          value={`${aggregatedStats.actionCompletionRate}%`}
          icon={CheckCircle2}
          trend={aggregatedStats.actionCompletionRate > 80 ? "up" : aggregatedStats.actionCompletionRate < 50 ? "down" : null}
        />
        <StatCard
          title="Pending 360s"
          value={String(aggregatedStats.pending360s)}
          icon={AlertCircle}
          trend={aggregatedStats.pending360s > 3 ? "down" : aggregatedStats.pending360s === 0 ? "up" : null}
        />
      </section>

      {/* Competency heatmap — team avg per competency (from 360 snapshots) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Competency heatmap</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            How your team is perceived on each competency (others&apos; average). Red / amber / green follows the same
            bands as HR admin heatmaps.
          </p>
        </div>
        <Card className="border-border/60">
          <CardHeader className="border-border/40 border-b pb-4">
            <CardTitle className="text-base">Team averages</CardTitle>
            <CardDescription>One bar per competency — wider team coverage shows a fuller picture.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ManagerCompetencyHeatmapChart rows={competencyHeatmap} />
          </CardContent>
        </Card>
        {competencyHeatmap.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {competencyHeatmap.map((c) => (
              <Badge
                key={c.competencyKey}
                variant={
                  c.gapDirection === "positive"
                    ? "default"
                    : c.gapDirection === "negative"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs font-normal"
              >
                {c.competencyName}: {c.avgScore.toFixed(1)}
                {c.gapDirection === "positive"
                  ? " · aligned"
                  : c.gapDirection === "negative"
                    ? " · self vs others gap"
                    : " · balanced"}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Team Members Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Team Members</h2>
        <div className="rounded-xl border border-border/60 bg-card/50">
          <div className="grid gap-4 p-4 text-sm font-medium text-muted-foreground sm:grid-cols-6">
            <div className="sm:col-span-2">Name</div>
            <div>360 Status</div>
            <div>Competency</div>
            <div>Gap</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-border/60">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-4 p-4 text-sm sm:grid-cols-6"
              >
                <div className="sm:col-span-2">
                  <p className="font-medium text-white/90">{member.name || member.email}</p>
                  {member.department && (
                    <p className="text-xs text-white/50">{member.department}</p>
                  )}
                </div>
                <div>
                  {member.recent360Status === "completed" ? (
                    <Badge variant="default" className="text-xs">Completed</Badge>
                  ) : member.recent360Status === "in_progress" ? (
                    <Badge variant="secondary" className="text-xs">In Progress</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">None</Badge>
                  )}
                </div>
                <div>
                  {member.competencySnapshot?.othersAverage ? (
                    <span className="tabular-nums">
                      {member.competencySnapshot.othersAverage.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div>
                  {member.competencySnapshot?.gapSelfVsOthers !== null && member.competencySnapshot?.gapSelfVsOthers !== undefined ? (
                    <span
                      className={`tabular-nums ${
                        member.competencySnapshot.gapSelfVsOthers > 0.2
                          ? "text-amber-400"
                          : member.competencySnapshot.gapSelfVsOthers < -0.2
                            ? "text-emerald-400"
                            : "text-white/60"
                      }`}
                    >
                      {member.competencySnapshot.gapSelfVsOthers > 0 ? "+" : ""}
                      {member.competencySnapshot.gapSelfVsOthers.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div>
                  {member.pendingActions > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      {member.pendingActions} pending
                    </Badge>
                  ) : (
                    <span className="text-emerald-400 text-xs">All caught up</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: "up" | "down" | null;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="size-4 text-white/50" />
        </div>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend === "up" ? (
              <>
                <TrendingUp className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Healthy</span>
              </>
            ) : (
              <>
                <TrendingDown className="size-3 text-amber-400" />
                <span className="text-amber-400">Attention</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
