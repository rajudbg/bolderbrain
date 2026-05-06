import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { listAssessmentsWhereIamSubject, listMyEvaluatorAssignments } from "./actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { EvaluatorStatus } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { AssessmentsPageSkeleton } from "@/components/ui/skeleton-loading";

export default async function MyAssessmentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/assessments");
  }

  return (
    <Suspense fallback={<AssessmentsPageSkeleton />}>
      <AssessmentsContent />
    </Suspense>
  );
}

async function AssessmentsContent() {
  const [rows, asSubject] = await Promise.all([
    listMyEvaluatorAssignments(),
    listAssessmentsWhereIamSubject(),
  ]);

  return (
    <div className="bg-[#0F0F11] min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-white/90">My assessments</h1>
            <p className="mt-1 text-sm text-white/55">Open a task to continue or submit your feedback.</p>
          </div>
          <Link href="/app/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
        </div>

        {asSubject.length > 0 && (
          <div className="mb-10 space-y-3">
            <h2 className="font-heading text-lg font-medium text-white/85">Assessments about you</h2>
            <ul className="space-y-2">
              {asSubject.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
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
          </div>
        )}

        <h2 className="font-heading mb-3 text-lg font-medium text-white/85">Your rater tasks</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-white/50">No assessment tasks assigned to you.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((ev) => {
              const a = ev.assessment;
              const done = ev.status === EvaluatorStatus.COMPLETED;
              return (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-white/15 hover:bg-white/[0.05]"
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
                    <Link href={`/assessments/${ev.id}`} className={buttonVariants({ size: "sm" })}>
                      {done ? "View" : "Continue"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}