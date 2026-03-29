import Link from "next/link";
import { ClipboardList, GraduationCap, LayoutGrid, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { listOrgAssignmentsForAdmin } from "../assignment-actions";
import { cn } from "@/lib/utils";
import { AssignmentProgramsClient } from "./programs-client";

export default async function AssessmentProgramsPage() {
  const orgId = await requireAdminOrganizationId();
  const raw = await listOrgAssignmentsForAdmin();
  const initialRows = raw.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    dueAt: r.dueAt?.toISOString() ?? null,
    lastReminderAt: r.lastReminderAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    assignedUser: r.assignedUser,
    template: r.template,
  }));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-caption-cerebral text-[10px]">HR Intelligence</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-4xl">
          Assessment programs
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">
          Launch org-wide assignments for cognitive, EQ, and personality assessments; monitor status; send reminders. 360°
          feedback and training cohorts use their dedicated consoles — linked below.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/feedback-360"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-auto min-h-[5.5rem] flex-col items-start justify-center gap-1 border-white/10 py-4 text-left",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <ClipboardList className="size-4 text-indigo-400" />
            360 feedback
          </span>
          <span className="text-xs font-normal text-white/45">Launch, monitor, remind evaluators</span>
        </Link>
        <Link
          href="/admin/training"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-auto min-h-[5.5rem] flex-col items-start justify-center gap-1 border-white/10 py-4 text-left",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <GraduationCap className="size-4 text-amber-400" />
            Training programs
          </span>
          <span className="text-xs font-normal text-white/45">
            Knowledge & behavioral tests, pre/post, enroll, remind
          </span>
        </Link>
        <Link
          href="/admin/usage"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-auto min-h-[5.5rem] flex-col items-start justify-center gap-1 border-white/10 py-4 text-left",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <LayoutGrid className="size-4 text-white/50" />
            Usage
          </span>
          <span className="text-xs font-normal text-white/45">Volume by assessment type</span>
        </Link>
        <Link
          href="/app/training"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-auto min-h-[5.5rem] flex-col items-start justify-center gap-1 border-white/10 py-4 text-left",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <Sparkles className="size-4 text-violet-400" />
            Employee view
          </span>
          <span className="text-xs font-normal text-white/45">Preview learner experience</span>
        </Link>
      </section>

      <Card className="border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base text-white/90">IQ · EQ · Personality assignments</CardTitle>
          <CardDescription className="text-white/45">
            Assigns a template to people in your org, emails them a link (when email is configured), and tracks
            completion from employee attempts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentProgramsClient orgId={orgId} initialRows={initialRows} />
        </CardContent>
      </Card>
    </div>
  );
}
