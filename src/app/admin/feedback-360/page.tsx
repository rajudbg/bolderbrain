import { Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedback360Console } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { Feedback360AssignmentCards } from "./feedback-360-assignment-cards";
import { Launch360ReviewButton } from "@/components/admin/launch-360-review-button";

export default async function Feedback360Page() {
  const orgId = await requireAdminOrganizationId();
  const rows = await getFeedback360Console(orgId);

  const stalled = rows.filter((r) => r.stalled);
  const atRisk = stalled.length;
  const empty = rows.length === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-caption-cerebral text-[10px]">360 feedback</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-4xl">
            Management console
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/55">
            Track progress, send reminders, extend deadlines, and cancel cycles. Integrate email for production reminders.
          </p>
        </div>
        <div className="flex w-full shrink-0 justify-end sm:w-auto sm:pt-4">
          <Launch360ReviewButton />
        </div>
      </header>

      <Card className="border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base text-white/90">How to run a 360 review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-white/65">
          <p>
            <strong className="font-medium text-white/90">1. Template.</strong> Ensure your behavioral 360 template and
            questions are published in Super Admin (competency keys align with your org competency catalog).
          </p>
          <p>
            <strong className="font-medium text-white/90">2. Launch.</strong> Create a 360 for each subject with self, peer,
            and manager evaluators. Communicate deadlines and expectations outside the product if needed.
          </p>
          <p>
            <strong className="font-medium text-white/90">3. Monitor.</strong> Use this console to spot stalled cycles,
            extend due dates, and cancel duplicates.
          </p>
          <p>
            <strong className="font-medium text-white/90">4. Results.</strong> When all evaluators submit, scores compute
            automatically; employees see results on their dashboard and receive suggested development actions.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/45">Tracked cycles</CardDescription>
            <CardTitle className="font-data text-2xl tabular-nums text-white/90">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/45">At risk (&gt;7d no movement)</CardDescription>
            <CardTitle className="font-data text-2xl tabular-nums text-amber-400">{atRisk}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/45">Completion analytics</CardDescription>
            <CardTitle className="text-sm font-normal leading-relaxed text-white/70">
              Average time-to-complete requires event timestamps — use stalled list as a proxy for now.
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {empty && (
        <div className="flex justify-center py-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.08] to-white/[0.02] p-10 text-center shadow-[0_0_60px_rgba(245,158,11,0.15)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.2),transparent)]" />
            <div className="relative">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-600/20 text-amber-200/90 shadow-[0_0_40px_rgba(245,158,11,0.25)]">
                <Rocket className="size-8" aria-hidden />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-white/95">Start your first 360 feedback cycle</h2>
              <p className="mt-3 text-sm text-white/55">
                Launch a review for a subject, assign peers and manager, and track completion from this console.
              </p>
              <div className="mt-8 flex justify-center">
                <Launch360ReviewButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {stalled.length > 0 && (
        <Card className="border-amber-500/25 bg-amber-950/25 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="font-heading text-base text-amber-100/90">At risk (stalled)</CardTitle>
            <CardDescription className="text-white/55">
              Active assessments with reviewers inactive for 7+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
              {stalled.slice(0, 8).map((r) => (
                <li key={r.id}>
                  {r.subjectName ?? r.subjectEmail} — {r.progressPct}% — {r.templateName}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-white/90">Active assignments</h2>
          <p className="text-sm text-white/45">Card grid with progress rings and timelines.</p>
        </div>
        <div className="p-3 sm:p-5">
          <Feedback360AssignmentCards rows={rows} />
        </div>
      </div>
    </div>
  );
}
