import Link from "next/link";
import { requireOrgAdmin } from "@/lib/org-auth";
import {
  listAssessmentsForOrg,
  listBehavioralTemplatesForOrg,
  listOrgMembersForPicker,
} from "./actions";
import { CreateAssessmentSection } from "./_components/create-assessment-section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EvaluatorRole, EvaluatorStatus } from "@/generated/prisma/enums";

function roleLabel(r: EvaluatorRole): string {
  switch (r) {
    case EvaluatorRole.SELF:
      return "Self";
    case EvaluatorRole.PEER:
      return "Peer";
    case EvaluatorRole.MANAGER:
      return "Manager";
    default:
      return r;
  }
}

function statusBadge(s: EvaluatorStatus) {
  const variant = s === EvaluatorStatus.COMPLETED ? "default" : s === EvaluatorStatus.IN_PROGRESS ? "secondary" : "outline";
  return <Badge variant={variant}>{s.replace(/_/g, " ")}</Badge>;
}

export default async function OrgAssessmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireOrgAdmin(slug);
  const [rows, templates, members] = await Promise.all([
    listAssessmentsForOrg(slug),
    listBehavioralTemplatesForOrg(slug),
    listOrgMembersForPicker(slug),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">360 behavioral assessments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a run from a BEHAVIORAL_360 template, assign raters, then open results when everyone has submitted.
        </p>
      </div>

      <CreateAssessmentSection slug={slug} templates={templates} members={members} />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Active &amp; recent</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No assessments yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Raters</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title ?? a.template.name}</TableCell>
                    <TableCell>{a.subject.name ?? a.subject.email}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[280px] text-xs">
                      {a.evaluators.map((e) => (
                        <span key={e.id} className="mr-2 inline-block">
                          {roleLabel(e.role)}: {e.user.name ?? e.user.email} {statusBadge(e.status)}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      {a.result ? (
                        <Badge variant="default">Scored</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/org/${slug}/assessments/${a.id}`}
                        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
