import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgAdmin } from "@/lib/org-auth";
import {
  getAssessmentAdminDetail,
  listOrgMembersForPicker,
  triggerScoreRecheck,
} from "../actions";
import { BulkPeersForm } from "./_components/bulk-peers-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { AssessmentInstanceStatus, EvaluatorRole, EvaluatorStatus } from "@/generated/prisma/enums";

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

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; assessmentId: string }>;
}) {
  const { slug, assessmentId } = await params;
  await requireOrgAdmin(slug);
  const [detail, members] = await Promise.all([
    getAssessmentAdminDetail(slug, assessmentId),
    listOrgMembersForPicker(slug),
  ]);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{detail.title ?? detail.template.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Subject: {detail.subject.name ?? detail.subject.email} · Template: {detail.template.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.result ? (
            <Link
              href={`/org/${slug}/assessments/${assessmentId}/results`}
              className={cn(buttonVariants())}
            >
              View results
            </Link>
          ) : (
            <form action={triggerScoreRecheck.bind(null, slug, assessmentId)}>
              <Button type="submit" variant="secondary">
                Recalculate scores
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Rater</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {detail.evaluators.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="p-3">{e.user.name ?? e.user.email}</td>
                <td className="p-3">{roleLabel(e.role)}</td>
                <td className="p-3">
                  <Badge variant={e.status === EvaluatorStatus.COMPLETED ? "default" : "secondary"}>
                    {e.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="p-3">
                  <Link
                    href={`/assessments/${e.id}`}
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    Open as rater
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail.status !== AssessmentInstanceStatus.COMPLETED && (
        <BulkPeersForm slug={slug} assessmentId={assessmentId} members={members} existingUserIds={detail.evaluators.map((e) => e.userId)} subjectUserId={detail.subjectUserId} />
      )}
    </div>
  );
}
