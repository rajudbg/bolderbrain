import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Launch360ReviewButton } from "@/components/admin/launch-360-review-button";
import { cn } from "@/lib/utils";
import {
  defaultDateRange,
  getAdminAlerts,
  getAdminOverviewKpis,
  getAssessmentDistribution,
  previousPeriod,
} from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { UsageMiniChart } from "./_components/usage-mini-chart";

export default async function AdminOverviewPage() {
  const orgId = await requireAdminOrganizationId();
  const range = defaultDateRange();
  const prev = previousPeriod(range);

  const [kpis, alerts, distribution] = await Promise.all([
    getAdminOverviewKpis(orgId, range, prev),
    getAdminAlerts(orgId),
    getAssessmentDistribution(orgId, range),
  ]);

  const chartData = [
    { name: "360", value: distribution.feedback360 },
    { name: "IQ", value: distribution.iq },
    { name: "EQ", value: distribution.eq },
    { name: "Personality", value: distribution.psych },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-wide text-white/45 uppercase">Executive overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white/90">Organizational intelligence</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Rule-based metrics for the selected organization. Filter deeper on each sub-page (department, date range,
            assessment type).
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
          <Launch360ReviewButton className="w-full sm:w-auto" />
          <Link href="/admin/reports" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full sm:w-auto")}>
            Exports & reports
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total employees"
          value={String(kpis.totalEmployees)}
          sub="Organization roster"
          trend={null}
        />
        <KpiCard
          title="Active 360s"
          value={String(kpis.activeAssessments)}
          sub="In-flight feedback cycles"
          trend={null}
        />
        <KpiCard
          title="360 completion rate"
          value={`${kpis.completionRatePct}%`}
          sub="Completed ÷ created (window)"
          trend={{
            label: "vs prior window",
            delta: kpis.completionTrend,
          }}
        />
        <KpiCard
          title="Avg competency (others)"
          value={String(kpis.avgCompetencyScore)}
          sub="From score snapshots"
          trend={{
            label: "vs prior window",
            delta: kpis.avgCompetencyTrend,
          }}
        />
      </section>

      {(alerts.pendingEvaluations > 0 ||
        alerts.unassigned360 > 0 ||
        alerts.overdue360 > 0 ||
        alerts.stalled360 > 0) && (
        <Card className="border-amber-900/40 bg-amber-950/20">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <AlertTriangle className="text-amber-400 size-5" />
            <CardTitle className="text-base">Actions required</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              <li>
                <strong>{alerts.pendingEvaluations}</strong> pending evaluator responses
              </li>
              <li>
                <strong>{alerts.unassigned360}</strong> active 360s with no reviewers assigned
              </li>
              <li>
                <strong>{alerts.overdue360}</strong> active 360s past due date
              </li>
              <li>
                <strong>{alerts.stalled360}</strong> active 360s with stalled reviewers (&gt;7 days)
              </li>
            </ul>
            <Link
              href="/admin/feedback-360"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex")}
            >
              Open 360 console
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment activity</CardTitle>
            <CardDescription>Completed assessments in the last 90 days (by type)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <UsageMiniChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Drill into teams, risks, and exports</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Launch360ReviewButton className="col-span-full w-full justify-center sm:col-span-2" />
            <Link href="/admin/assessment-programs" className={cn(buttonVariants({ variant: "outline" }))}>
              Assessment programs
            </Link>
            <Link href="/admin/competencies" className={cn(buttonVariants({ variant: "outline" }))}>
              Competency heatmap
            </Link>
            <Link href="/admin/talent" className={cn(buttonVariants({ variant: "outline" }))}>
              Talent &amp; risk
            </Link>
            <Link href="/admin/people" className={cn(buttonVariants({ variant: "outline" }))}>
              People directory
            </Link>
            <Link href="/admin/action-center" className={cn(buttonVariants({ variant: "outline" }))}>
              Action bottlenecks
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benchmarking (illustrative)</CardTitle>
          <CardDescription>Mock industry comparison — replace with your norms when available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your org&apos;s average others-rating is <strong>{kpis.avgCompetencyScore}</strong> on a 1–5 style scale vs
            a mock industry median of <strong>3.6</strong>. Use the competency heatmap to localize gaps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  trend,
}: {
  title: string;
  value: string;
  sub: string;
  trend: { label: string; delta: number } | null;
}) {
  const up = trend && trend.delta > 0;
  const down = trend && trend.delta < 0;
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-1 text-xs">
        <p>{sub}</p>
        {trend ? (
          <p className="flex items-center gap-1 font-medium text-foreground">
            {up ? <ArrowUpRight className="size-3.5 text-emerald-500" /> : null}
            {down ? <ArrowDownRight className="size-3.5 text-rose-500" /> : null}
            {!up && !down ? <span className="text-muted-foreground">—</span> : null}
            {trend.label}: {trend.delta > 0 ? "+" : ""}
            {trend.delta.toFixed(2)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
