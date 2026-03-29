import { redirect } from "next/navigation";
import { getEmployeeDashboardPayload } from "@/lib/employee-dashboard";
import { getRecommendationsForUser } from "@/lib/recommendations";
import { BehaviorRadar } from "./_components/behavior-radar";
import { CompetencyTrendsBlock } from "./_components/competency-trends";
import { CurrentActionsWidget } from "./_components/current-actions-widget";
import { DashboardEmpty } from "./_components/dashboard-empty";
import { GapAnalysisChart } from "./_components/gap-analysis-chart";
import { InsightCards } from "./_components/insight-cards";
import { RecentAssessmentsWidget } from "./_components/recent-assessments";
import { EmployeeOnboarding } from "./_components/employee-onboarding";
import { RecommendationsWidget } from "./_components/recommendations-widget";
import { DashboardAnalyticsCharts } from "./_components/dashboard-analytics-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EmployeeDashboardPage() {
  const data = await getEmployeeDashboardPayload();
  if (!data) redirect("/login?callbackUrl=/app/dashboard");

  const recommendations = await getRecommendationsForUser();
  const allRecommendations = recommendations
    ? [...recommendations.byCategory.competencyGaps, ...recommendations.byCategory.developmentAreas, ...recommendations.byCategory.skillBuilding]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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
          Track your development, view insights, and manage your growth journey.
        </p>
      </header>

      <EmployeeOnboarding />

      {/* Primary Actions & Recommendations */}
      <section className="grid gap-6 lg:grid-cols-2">
        <CurrentActionsWidget
          weekKey={data.weeklyFocus.weekKey}
          items={data.weeklyFocus.items}
          completed={data.weeklyFocus.completed}
          total={data.weeklyFocus.total}
        />
        <RecommendationsWidget
          recommendations={allRecommendations}
          highPriorityCount={recommendations?.highPriorityCount || 0}
        />
      </section>

      <DashboardAnalyticsCharts
        assessmentMix={data.assessmentActivityMix}
        eqDomains={data.eqDomainChart}
      />

      {!data.profile ? (
        <DashboardEmpty tenants={data.tenants} isOrgAdmin={data.isOrgAdmin} />
      ) : (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/[0.03] border border-white/10">
            <TabsTrigger value="profile">Behavior Profile</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Competency Radar</h2>
                <p className="text-muted-foreground text-sm">
                  {data.profile.title} · {data.profile.orgName} — Compare self, peer, and manager perspectives.
                </p>
              </div>
              <Card className="border-border/60 overflow-hidden shadow-md">
                <CardHeader className="border-border/40 border-b bg-gradient-to-r from-blue-50/40 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/10">
                  <CardTitle className="text-base">360 View</CardTitle>
                  <CardDescription>Toggle series to compare perspectives.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <BehaviorRadar scores={data.profile.scores} />
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Self vs Others Gap</h2>
                <p className="text-muted-foreground text-sm">
                  Where your self-perception differs from how others see you.
                </p>
              </div>
              <Card className="border-border/60 shadow-md">
                <CardContent className="pt-6">
                  <GapAnalysisChart scores={data.profile.scores} />
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {data.insights.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">360 Insights</h2>
                  <p className="text-muted-foreground text-sm">Top signals from your latest results.</p>
                </div>
                <InsightCards insights={data.insights} />
              </section>
            )}

            {data.eqInsights.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Emotional Intelligence</h2>
                  <p className="text-muted-foreground text-sm">From your latest EQ reflection.</p>
                </div>
                <InsightCards insights={data.eqInsights} />
              </section>
            )}
          </TabsContent>

          <TabsContent value="trends">
            <CompetencyTrendsBlock trends={data.competencyTrends} />
          </TabsContent>
        </Tabs>
      )}

      <section>
        <RecentAssessmentsWidget rows={data.recentAssessments} />
      </section>
    </div>
  );
}
