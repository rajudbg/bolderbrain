import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsClient, ReportsPrintButton } from "./reports-client";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Exports</p>
        <h1 className="text-3xl font-semibold tracking-tight">Reports &amp; integrations</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Download CSV for HRIS pipelines and generate print-ready packets for employee conversations.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee roster (CSV)</CardTitle>
            <CardDescription>Name, email, department, role, active flag</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="people" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>360 summary (CSV)</CardTitle>
            <CardDescription>Latest tracked 360 rows with progress fields</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="360" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>EQ results (CSV)</CardTitle>
            <CardDescription>Goleman domain scores and composite percentiles per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="eq" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Psychometric results (CSV)</CardTitle>
            <CardDescription>Big Five / OCEAN trait percentiles per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="psychometric" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IQ results (CSV)</CardTitle>
            <CardDescription>Cognitive scores, percentiles, and category labels per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="iq" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Training impact (CSV)</CardTitle>
            <CardDescription>Pre/post scores, change, and impact bands per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="training" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Talent lists (CSV)</CardTitle>
            <CardDescription>High-risk and high-potential employees with reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsClient kind="talent" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDF performance packet</CardTitle>
          <CardDescription>Print-optimized page for an employee</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <ReportsPrintButton />
          <p className="text-muted-foreground w-full text-xs">
            Uses the browser print dialog — for branded PDFs, add a dedicated print stylesheet or server renderer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
