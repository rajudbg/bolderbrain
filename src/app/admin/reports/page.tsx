import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsClient, ReportsPrintButton } from "./reports-client";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Exports</p>
        <h1 className="text-3xl font-semibold tracking-tight">Reports &amp; integrations</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Download CSV for HRIS pipelines. PDF and scheduled digests are scaffolded — connect your document and job
          runners.
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

      <Card>
        <CardHeader>
          <CardTitle>Scheduled weekly digest</CardTitle>
          <CardDescription>Email summary of completed assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Stub — connect a cron worker + mail provider. Recommended payload: KPIs from the overview page + new
            completions count.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
