import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { listAssessmentsWhereIamSubject, listMyEvaluatorAssignments } from "./actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { EvaluatorStatus } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { AssessmentsPageSkeleton } from "@/components/ui/skeleton-loading";
import { AppShell } from "@/app/app/_components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminTenants } from "@/lib/admin/context";

export default async function MyAssessmentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/assessments");
  }

  const canManageOrg = listAdminTenants(session.user.tenants).length > 0;

  return (
    <AppShell
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
      showAdminLink={canManageOrg}
      showManagerLink={canManageOrg}
    >
      <Suspense fallback={<AssessmentsPageSkeleton />}>
        <AssessmentsContent />
      </Suspense>
    </AppShell>
  );
}

async function AssessmentsContent() {
  const [rows, asSubject] = await Promise.all([
    listMyEvaluatorAssignments(),
    listAssessmentsWhereIamSubject(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <header>
        <p className="text-caption-cerebral">Evaluation</p>
        <h1 className="text-gradient-heading text-4xl">My assessments</h1>
        <p className="text-body-cerebral mt-1">
          Open a task to continue or submit your feedback.
        </p>
      </header>

      {asSubject.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Assessments about you</CardTitle>
            <CardDescription>View results and reports for assessments you have completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {asSubject.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                >
                  <div>
                    <p className="font-medium text-white/90">{a.title ?? a.template.name}</p>
                    <p className="text-xs text-white/45">{a.organization.name}</p>
                  </div>
                  {a.result ? (
                    <Link
                      href={`/org/${a.organization.slug}/assessments/${a.id}/results`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      View results
                    </Link>
                  ) : (
                    <span className="text-xs text-white/45">Results pending raters</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Your rater tasks</CardTitle>
          <CardDescription>Assessments requiring your feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-white/50 py-4">No assessment tasks assigned to you.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((ev) => {
                const a = ev.assessment;
                const done = ev.status === EvaluatorStatus.COMPLETED;
                return (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                  >
                    <div>
                      <p className="font-medium text-white/90">{a.title ?? a.template.name}</p>
                      <p className="text-xs text-white/45">
                        {a.organization.name} &middot; Subject: {a.subject.name ?? a.subject.email} &middot; You:{" "}
                        {ev.role.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={done ? "default" : "secondary"}>{ev.status.replace(/_/g, " ")}</Badge>
                      <Link href={`/assessments/${ev.id}`} className={buttonVariants({ size: "sm", variant: done ? "outline" : "default" })}>
                        {done ? "View" : "Continue"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}