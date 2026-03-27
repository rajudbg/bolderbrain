"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  completeTrainingProgram,
  exportTrainingCsv,
  launchPostAssessments,
  launchTrainingPreAssessments,
  markCohortTrainingComplete,
  updateTrainingAttendance,
} from "../actions";
import { EnrollmentStatus, TrainingStatus } from "@/generated/prisma/enums";
import { cohortMeanDelta, type TrainingDeltaPayload } from "@/lib/training-impact";
import { cn } from "@/lib/utils";

type Enr = {
  id: string;
  userId: string;
  status: EnrollmentStatus;
  preAssignmentId: string | null;
  postAssignmentId: string | null;
  delta: unknown;
  user: { name: string | null; email: string | null };
};

export function TrainingProgramDashboard({
  program,
}: {
  program: {
    id: string;
    name: string;
    description: string | null;
    status: TrainingStatus;
    trainingDate: Date | string;
    preOpensAt: Date | string;
    preClosesAt: Date | string;
    postOpensAt: Date | string;
    postClosesAt: Date | string;
    attendanceCount: number | null;
    attendanceExpected: number | null;
    template: { name: string } | null;
    trainingContentTemplate: { name: string; kind: string } | null;
    enrollments: Enr[];
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [attended, setAttended] = useState(String(program.attendanceCount ?? ""));
  const [expected, setExpected] = useState(String(program.attendanceExpected ?? program.enrollments.length));

  const stats = useMemo(() => {
    const n = program.enrollments.length;
    const preDone = program.enrollments.filter(
      (e) =>
        e.status === EnrollmentStatus.PRE_COMPLETED ||
        e.status === EnrollmentStatus.TRAINING_COMPLETED ||
        e.status === EnrollmentStatus.POST_COMPLETED,
    ).length;
    const postDone = program.enrollments.filter((e) => e.status === EnrollmentStatus.POST_COMPLETED).length;
    const cohortDelta = cohortMeanDelta(
      program.enrollments.map((e) => ({ delta: e.delta })),
    );
    return { n, preDone, postDone, cohortDelta };
  }, [program.enrollments]);

  async function run(action: () => Promise<void>, key: string) {
    setPending(key);
    try {
      await action();
      toast.success("Updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  async function downloadCsv() {
    try {
      const csv = await exportTrainingCsv(program.id);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training-${program.id.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/training"
          className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/90"
        >
          <ArrowLeft className="size-4" />
          Programs
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-white/95 md:text-3xl">{program.name}</h1>
            <p className="mt-1 text-sm text-white/50">{program.description}</p>
            <p className="mt-2 text-xs text-white/40">
              Template:{" "}
              <span className="text-white/70">
                {program.template?.name ?? program.trainingContentTemplate?.name ?? "—"}
              </span>
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-white/20 text-white/70">
            {program.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
          <p className="text-caption-cerebral text-[10px] text-sky-200/60">Pre completion</p>
          <p className="mt-1 font-heading text-2xl text-white/95">
            {stats.preDone}/{stats.n}
          </p>
          <p className="text-xs text-white/45">{stats.n ? Math.round((stats.preDone / stats.n) * 100) : 0}%</p>
        </div>
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
          <p className="text-caption-cerebral text-[10px] text-violet-200/60">Training attendance</p>
          <p className="mt-1 font-heading text-2xl text-white/95">
            {program.attendanceCount ?? "—"}/{expected || stats.n}
          </p>
          <p className="text-xs text-white/45">Manual entry</p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-caption-cerebral text-[10px] text-amber-200/60">Post completion</p>
          <p className="mt-1 font-heading text-2xl text-white/95">
            {stats.postDone}/{stats.n}
          </p>
          <p className="text-xs text-white/45">{stats.n ? Math.round((stats.postDone / stats.n) * 100) : 0}%</p>
        </div>
      </div>

      {stats.cohortDelta != null && (
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-6 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
          <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-amber-200/70">
            Cohort impact
          </p>
          <p className="font-heading mt-2 text-4xl text-transparent bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text">
            +{stats.cohortDelta}% avg. improvement
          </p>
          <p className="mt-1 text-xs text-white/45">Mean percent change vs. pre-assessment (completed post only)</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(program.status === TrainingStatus.DRAFT || program.status === TrainingStatus.SCHEDULED) && (
          <Button
            type="button"
            disabled={pending !== null}
            className="bg-sky-500/90 text-white hover:bg-sky-400"
            onClick={() =>
              run(() => launchTrainingPreAssessments(program.id), "pre")
            }
          >
            {pending === "pre" ? "Launching…" : "Launch pre-assessments"}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => run(() => markCohortTrainingComplete(program.id), "train")}
        >
          {pending === "train" ? "…" : "Mark training complete (cohort)"}
        </Button>
        <Button
          type="button"
          className="bg-amber-500/90 text-black hover:bg-amber-400"
          disabled={pending !== null}
          onClick={() => run(() => launchPostAssessments(program.id), "post")}
        >
          {pending === "post" ? "…" : "Create post-assessments"}
        </Button>
        <Button type="button" variant="outline" onClick={() => void downloadCsv()}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending !== null}
          onClick={() => run(() => completeTrainingProgram(program.id), "done")}
        >
          Mark program completed
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/70">Attendance (actual)</Label>
          <Input
            type="number"
            min={0}
            value={attended}
            onChange={(e) => setAttended(e.target.value)}
            className="border-white/10 bg-white/[0.05]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Expected</Label>
          <Input
            type="number"
            min={0}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            className="border-white/10 bg-white/[0.05]"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="sm:col-span-2"
          onClick={() =>
            run(
              () =>
                updateTrainingAttendance(
                  program.id,
                  Number.parseInt(attended, 10) || 0,
                  Number.parseInt(expected, 10) || 0,
                ),
              "att",
            )
          }
        >
          Save attendance
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/45">
              <th className="px-3 py-2">Participant</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Δ overall %</th>
            </tr>
          </thead>
          <tbody>
            {program.enrollments.map((e) => {
              const d = e.delta as TrainingDeltaPayload | null;
              const pct = d?.overall?.percentChange;
              return (
                <tr key={e.id} className="border-b border-white/[0.06] text-white/85">
                  <td className="px-3 py-2">{e.user.name || e.user.email}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="border-white/15 text-xs">
                      {e.status}
                    </Badge>
                  </td>
                  <td className={cn("px-3 py-2 tabular-nums", pct != null && pct > 0 && "text-amber-200/90")}>
                    {pct != null ? `${pct > 0 ? "+" : ""}${pct}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <a
        href={`/api/training/${program.id}/calendar`}
        className="text-sm text-sky-300/80 underline underline-offset-2 hover:text-sky-200"
      >
        Download calendar (.ics) for training date
      </a>
    </div>
  );
}
