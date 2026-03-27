import { redirect } from "next/navigation";
import { getEmployeeDashboardPayload } from "@/lib/employee-dashboard";
import { BehaviorRadar } from "./_components/behavior-radar";
import { CompetencyTrendsBlock } from "./_components/competency-trends";
import { CurrentActionsWidget } from "./_components/current-actions-widget";
import { DashboardEmpty } from "./_components/dashboard-empty";
import { GapAnalysisChart } from "./_components/gap-analysis-chart";
import { InsightCards } from "./_components/insight-cards";
import { RecentAssessmentsWidget } from "./_components/recent-assessments";
import { EmployeeOnboarding } from "./_components/employee-onboarding";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeDashboardPage() {
  const data = await getEmployeeDashboardPayload();
  if (!data) redirect("/login?callbackUrl=/app/dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Employee</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-gradient-heading text-4xl md:text-5xl">Dashboard</h1>
          {data.streak > 0 && (
            <Badge variant="secondary" className="font-normal">
              {data.streak} week streak
            </Badge>
          )}
        </div>
        <p className="text-body-cerebral max-w-2xl">
          Your latest 360 behavioral results, visualized. Insights update when new assessments complete.
        </p>
      </header>

      <EmployeeOnboarding />

      <section className="grid gap-6 lg:grid-cols-2">
        <CurrentActionsWidget
          weekKey={data.weeklyFocus.weekKey}
          items={data.weeklyFocus.items}
          completed={data.weeklyFocus.completed}
          total={data.weeklyFocus.total}
        />
        <CompetencyTrendsBlock trends={data.competencyTrends} />
      </section>

      {!data.profile ? (
        <DashboardEmpty tenants={data.tenants} isOrgAdmin={data.isOrgAdmin} />
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your behavior profile</h2>
              <p className="text-muted-foreground text-sm">
                {data.profile.title} · {data.profile.orgName} — self, peer, and manager averages by competency.
              </p>
            </div>
            <Card className="border-border/60 overflow-hidden shadow-md transition-shadow hover:shadow-lg">
              <CardHeader className="border-border/40 border-b bg-gradient-to-r from-blue-50/40 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/10">
                <CardTitle className="text-base">Competency radar</CardTitle>
                <CardDescription>Toggle series to compare perspectives.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <BehaviorRadar scores={data.profile.scores} />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Self vs others</h2>
              <p className="text-muted-foreground text-sm">
                Gap = your self rating minus the average of peers and manager (per competency).
              </p>
            </div>
            <Card className="border-border/60 shadow-md">
              <CardContent className="pt-6">
                <GapAnalysisChart scores={data.profile.scores} />
              </CardContent>
            </Card>
          </section>

          {data.insights.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">360 insights</h2>
                <p className="text-muted-foreground text-sm">Top signals from your latest results.</p>
              </div>
              <InsightCards insights={data.insights} />
            </section>
          )}
        </>
      )}

      {data.eqInsights.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Emotional intelligence</h2>
            <p className="text-muted-foreground text-sm">From your latest EQ reflection — developmental, not evaluative.</p>
          </div>
          <InsightCards insights={data.eqInsights} />
        </section>
      )}

      <section>
        <RecentAssessmentsWidget rows={data.recentAssessments} />
      </section>
    </div>
  );
}
