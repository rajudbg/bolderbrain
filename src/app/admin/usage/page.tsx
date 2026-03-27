import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultDateRange, getAssessmentDistribution } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import { UsageMiniChart } from "../_components/usage-mini-chart";

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

  const mockCostPerAssessment = 12;
  const totalCost = d.total * mockCostPerAssessment;
  const costPerEmployee = headcount > 0 ? Math.round((totalCost / headcount) * 100) / 100 : 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Adoption</p>
        <h1 className="text-3xl font-semibold tracking-tight">Assessment usage</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Completed assessments in the last 90 days. Cost figures use placeholder unit economics.
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
            <CardTitle>Cost / ROI (mock)</CardTitle>
            <CardDescription>Replace with your finance data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Total completions:</strong> {d.total}
            </p>
            <p>
              <strong>Assumed avg cost / assessment:</strong> ${mockCostPerAssessment}
            </p>
            <p>
              <strong>Implied spend (window):</strong> ${totalCost}
            </p>
            <p>
              <strong>Cost per employee (roster):</strong> ${costPerEmployee}
            </p>
            <p className="text-muted-foreground text-xs">
              Insights generated per dollar: tie to completed actions + reports exported (instrument later).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
