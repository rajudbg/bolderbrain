import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultDateRange, getCompetencyHeatmap } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";

function cellColor(avg: number | null): string {
  if (avg == null) return "bg-slate-100 dark:bg-slate-900";
  if (avg < 3) return "bg-rose-500/25 text-rose-950 dark:text-rose-100";
  if (avg < 3.7) return "bg-amber-400/25 text-amber-950 dark:text-amber-100";
  return "bg-emerald-500/20 text-emerald-950 dark:text-emerald-100";
}

export default async function CompetenciesHeatmapPage() {
  const orgId = await requireAdminOrganizationId();
  const range = defaultDateRange();
  const heat = await getCompetencyHeatmap(orgId, range);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Organization</p>
        <h1 className="text-3xl font-semibold tracking-tight">Competency heatmap</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Aggregated others-average from competency snapshots (last 90 days). Red = weaker, yellow = developing, green =
          strong. Add departments on member profiles for column splits.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Matrix</CardTitle>
          <CardDescription>Rows = competencies · Columns = departments / teams</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-50 px-2 py-2 text-left dark:border-slate-800 dark:bg-slate-900">
                  Competency
                </th>
                {heat.cols.map((c) => (
                  <th
                    key={c}
                    className="border border-slate-200 bg-slate-50 px-2 py-2 text-center font-medium dark:border-slate-800 dark:bg-slate-900"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heat.rows.map((row) => (
                <tr key={row}>
                  <td className="border border-slate-200 px-2 py-2 font-medium dark:border-slate-800">{row}</td>
                  {heat.cols.map((col) => {
                    const cell = heat.cells.find((x) => x.competencyKey === row && x.department === col);
                    return (
                      <td
                        key={`${row}-${col}`}
                        className={`border border-slate-200 px-2 py-2 text-center tabular-nums dark:border-slate-800 ${cellColor(cell?.avg ?? null)}`}
                      >
                        {cell?.avg != null ? cell.avg.toFixed(2) : "—"}
                        {cell && cell.sampleSize > 0 ? (
                          <span className="text-muted-foreground block text-[10px]">n={cell.sampleSize}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization blind spots</CardTitle>
          <CardDescription>Lowest aggregate competencies — prioritize development programs</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {heat.blindSpots.map((b) => (
              <li key={b.competencyKey}>
                <strong>{b.competencyKey}</strong> — avg {b.avg.toFixed(2)}{" "}
                <Link href="/admin/talent" className="text-primary ml-2 underline-offset-2 hover:underline">
                  View talent insights
                </Link>
              </li>
            ))}
            {heat.blindSpots.length === 0 ? (
              <li className="text-muted-foreground">Not enough snapshot data yet.</li>
            ) : null}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
