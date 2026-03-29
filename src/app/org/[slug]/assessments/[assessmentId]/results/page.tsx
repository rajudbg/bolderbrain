import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgMember } from "@/lib/org-auth";
import { getOrgAssessmentResults } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ slug: string; assessmentId: string }>;
}) {
  const { slug, assessmentId } = await params;
  await requireOrgMember(slug);
  const data = await getOrgAssessmentResults(slug, assessmentId);
  if (!data) notFound();

  if (data.kind === "pending") {
    return (
      <div className="space-y-4">
        <Link
          href={`/org/${slug}/assessments/${assessmentId}`}
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Back to assessment
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Results not ready</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Scores are calculated after every assigned rater has submitted. {data.title} — subject:{" "}
          {data.subjectName ?? "—"}.
        </p>
      </div>
    );
  }

  if (data.kind === "tna") {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/org/${slug}/assessments/${assessmentId}`}
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← Back to assessment
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">TNA diagnostic results</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.title} · Subject: {data.subjectName ?? "—"} · Computed {data.computedAt.toLocaleString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall</CardTitle>
            <CardDescription>Trait aggregate across competencies (self-report).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{data.scores.overall.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competency scores</CardTitle>
            <CardDescription>Compared to targets in the gap analysis dashboard (training needs may have been generated).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scores.byCompetency.map((row) => (
                  <TableRow key={row.competencyKey}>
                    <TableCell className="font-medium">{row.competencyKey}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.score.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/org/${slug}/assessments/${assessmentId}`}
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Back to assessment
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">360 results</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.title} · Subject: {data.subjectName ?? "—"} · Computed {data.computedAt.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall</CardTitle>
          <CardDescription>Self vs combined others (peers + manager).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Self</p>
            <p className="text-2xl font-semibold tabular-nums">{data.scores.summary.selfOverall.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Others</p>
            <p className="text-2xl font-semibold tabular-nums">{data.scores.summary.othersOverall.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Gap (self − others)</p>
            <p className="text-2xl font-semibold tabular-nums">{data.scores.summary.gapSelfVsOthers.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap analysis</CardTitle>
          <CardDescription>Highest and lowest competency gaps (self vs others).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground text-xs uppercase">Highest gap</p>
            <p className="font-medium">{data.scores.gaps.highest.competencyKey}</p>
            <p className="text-xl tabular-nums">{data.scores.gaps.highest.gap.toFixed(2)}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground text-xs uppercase">Lowest gap</p>
            <p className="font-medium">{data.scores.gaps.lowest.competencyKey}</p>
            <p className="text-xl tabular-nums">{data.scores.gaps.lowest.gap.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competency breakdown</CardTitle>
          <CardDescription>Per competency averages by rater type.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency</TableHead>
                <TableHead className="text-right">Self</TableHead>
                <TableHead className="text-right">Peer avg</TableHead>
                <TableHead className="text-right">Manager</TableHead>
                <TableHead className="text-right">Others</TableHead>
                <TableHead className="text-right">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.scores.byCompetency.map((row) => (
                <TableRow key={row.competencyKey}>
                  <TableCell className="font-medium">{row.competencyKey}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.self !== undefined ? row.self.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.peerAvg !== undefined ? row.peerAvg.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.manager !== undefined ? row.manager.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.othersAverage.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.gapSelfVsOthers.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
