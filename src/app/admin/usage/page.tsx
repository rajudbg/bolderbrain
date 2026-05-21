import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultDateRange, getAssessmentDistribution } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import { UsageMiniChart } from "../_components/usage-mini-chart";

function assessmentUnitCostUsd() {
  const value = Number(process.env.ASSESSMENT_UNIT_COST_USD ?? "12");
  return Number.isFinite(value) && value >= 0 ? value : 12;
}

export default async function UsagePage() {
  const orgId = await requireAdminOrganizationId();
  const range = defaultDateRange();
  const d = await getAssessmentDistribution(orgId, range);

  const chartData = [
    { name: "360", value: d.feedback360 },
    { name: "IQ", value: d.iq },
    { name: "EQ", value: d.eq },
    { name: "Personality", value: d.psych },
  ];

  const headcount = await prisma.organizationMember.count({ where: { organizationId: orgId } });

  const costPerAssessment = assessmentUnitCostUsd();
  const totalCost = d.total * costPerAssessment;
  const costPerEmployee = headcount > 0 ? Math.round((totalCost / headcount) * 100) / 100 : 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Adoption</p>
        <h1 className="text-3xl font-semibold tracking-tight">Assessment usage</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Completed assessments in the last 90 days. Cost figures use your configured assessment unit cost.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume by type</CardTitle>
            <CardDescription>Completed assessments in window</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <UsageMiniChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cost / ROI</CardTitle>
            <CardDescription>Assessment unit cost — configurable in environment variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Total completions:</strong> {d.total}
            </p>
            <p>
              <strong>Configured avg cost / assessment:</strong> ${costPerAssessment}
            </p>
            <p>
              <strong>Implied spend (window):</strong> ${totalCost}
            </p>
            <p>
              <strong>Cost per employee (roster):</strong> ${costPerEmployee}
            </p>
            <p className="text-muted-foreground text-xs">
              Use this as a finance baseline; completed actions and report exports can be compared against this spend.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
