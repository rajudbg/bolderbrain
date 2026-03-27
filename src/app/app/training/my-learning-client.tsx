"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Circle, GraduationCap, Sparkles } from "lucide-react";
import type { MyTrainingRow } from "./actions";
import { cn } from "@/lib/utils";

export function MyLearningClient({ rows }: { rows: MyTrainingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
        <GraduationCap className="mx-auto size-12 text-indigo-400/50" />
        <p className="mt-4 text-sm text-white/50">You are not enrolled in any training programs yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.enrollmentId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white/95">{r.programName}</h2>
              <p className="mt-1 text-xs text-white/45">
                Training day: {new Date(r.trainingDate).toLocaleDateString()}
              </p>
            </div>
            <BookOpen className="size-5 shrink-0 text-indigo-400/80" />
          </div>

          <ol className="mt-6 space-y-4">
            <Stage
              accent="sky"
              label="Stage 1 — Pre"
              title="Establish your baseline"
              description="Complete your self-assessment before the workshop."
              done={r.preComplete}
              href={
                r.assessmentKind === "content"
                  ? r.preAttemptId && !r.preComplete
                    ? `/app/training/attempt/${r.preAttemptId}`
                    : undefined
                  : r.preEvaluatorId
                    ? `/assessments/${r.preEvaluatorId}`
                    : undefined
              }
              locked={r.assessmentKind === "content" ? !r.preAttemptId : !r.preEvaluatorId}
            />
            <Stage
              accent="violet"
              label="Stage 2 — Training"
              title="Attend your workshop"
              description="Apply skills in the live session."
              done={new Date() > new Date(r.trainingDate)}
              locked={false}
            />
            <Stage
              accent="amber"
              label="Stage 3 — Post"
              title="Measure your growth"
              description="Unlocked after your training date and post window opens."
              done={r.postComplete}
              href={(() => {
                const postOpen = new Date() >= new Date(r.postOpensAt);
                if (r.assessmentKind === "content") {
                  return r.postAttemptId && !r.postComplete && postOpen
                    ? `/app/training/attempt/${r.postAttemptId}`
                    : undefined;
                }
                return r.postEvaluatorId ? `/assessments/${r.postEvaluatorId}` : undefined;
              })()}
              locked={(() => {
                const postOpen = new Date() >= new Date(r.postOpensAt);
                if (r.assessmentKind === "content") {
                  return !r.postAttemptId || !postOpen;
                }
                return !r.postEvaluatorId;
              })()}
            />
          </ol>

          {r.postComplete && (
            <Link
              href={`/app/training/${r.programId}/results`}
              className={cn(
                "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/35",
                "bg-gradient-to-r from-amber-500/20 to-orange-500/10 py-3 text-sm font-medium text-amber-100",
                "hover:border-amber-300/50 hover:from-amber-500/30",
              )}
            >
              <Sparkles className="size-4" />
              View my results
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Stage({
  accent,
  label,
  title,
  description,
  done,
  href,
  locked,
}: {
  accent: "sky" | "violet" | "amber";
  label: string;
  title: string;
  description: string;
  done: boolean;
  href?: string;
  locked: boolean;
}) {
  const ring =
    accent === "sky"
      ? "border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
      : accent === "violet"
        ? "border-violet-400/35 shadow-[0_0_18px_rgba(167,139,250,0.12)]"
        : "border-amber-400/35 shadow-[0_0_22px_rgba(245,158,11,0.14)]";

  const content = (
    <div className={cn("flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3", !locked && href && "cursor-pointer hover:bg-white/[0.05]")}>
      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border", ring)}>
        {done ? <CheckCircle2 className="size-4 text-white/80" /> : <Circle className="size-4 text-white/35" />}
      </div>
      <div>
        <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/40">{label}</p>
        <p className="font-medium text-white/90">{title}</p>
        <p className="text-xs text-white/45">{description}</p>
        {href && !locked && (
          <p className="mt-2 text-xs font-medium text-sky-300/90">Open assessment →</p>
        )}
        {locked && <p className="mt-2 text-xs text-white/35">Not available yet</p>}
      </div>
    </div>
  );

  if (href && !locked) {
    return (
      <li>
        <Link href={href}>{content}</Link>
      </li>
    );
  }
  return <li>{content}</li>;
}
