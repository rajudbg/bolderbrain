"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Circle, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import type { MyTrainingRow } from "./actions";
import { cn } from "@/lib/utils";

function calculateProgress(r: MyTrainingRow): number {
  let completed = 0;
  if (r.preComplete) completed++;
  if (new Date() > new Date(r.trainingDate)) completed++;
  if (r.postComplete) completed++;
  return (completed / 3) * 100;
}

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
      {rows.map((r, i) => {
        const progress = calculateProgress(r);
        return (
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

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-white/50">Program Progress</span>
                <span className="text-white/70 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    progress === 100
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-indigo-400 to-violet-400"
                  )}
                />
              </div>
            </div>

            {/* Learning Path Visualization */}
            <div className="mt-6 relative">
              {/* Path connector line */}
              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-white/[0.08]" />
              
              <ol className="relative space-y-4">
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
                  isFirst
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
                  isLast
                />
              </ol>
            </div>

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
        );
      })}
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
  isFirst,
  isLast,
}: {
  accent: "sky" | "violet" | "amber";
  label: string;
  title: string;
  description: string;
  done: boolean;
  href?: string;
  locked: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const ring =
    accent === "sky"
      ? "border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
      : accent === "violet"
        ? "border-violet-400/35 shadow-[0_0_18px_rgba(167,139,250,0.12)]"
        : "border-amber-400/35 shadow-[0_0_22px_rgba(245,158,11,0.14)]";

  const bgAccent =
    accent === "sky"
      ? "bg-sky-500/10"
      : accent === "violet"
        ? "bg-violet-500/10"
        : "bg-amber-500/10";

  const content = (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3 transition-all relative z-10",
        done
          ? "border-white/10 bg-white/[0.05]"
          : locked
            ? "border-white/5 bg-white/[0.02] opacity-60"
            : "border-white/10 bg-white/[0.03]",
        !locked && href && "cursor-pointer hover:bg-white/[0.06] hover:border-white/20"
      )}
    >
      {/* Connector dot */}
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
          done
            ? cn("border-emerald-400/60 bg-emerald-500/20", ring)
            : locked
              ? "border-white/20 bg-white/[0.04]"
              : cn("bg-white/[0.06]", ring)
        )}
      >
        {done ? (
          <CheckCircle2 className="size-4 text-emerald-400" />
        ) : locked ? (
          <Circle className="size-4 text-white/30" />
        ) : (
          <Circle className={cn("size-4", accent === "sky" ? "text-sky-400" : accent === "violet" ? "text-violet-400" : "text-amber-400")} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/40">
            {label}
          </p>
          {done && (
            <span className="text-[10px] text-emerald-400/80 font-medium">Completed</span>
          )}
        </div>
        <p className={cn("font-medium", done ? "text-white/70" : "text-white/90")}>{title}</p>
        <p className="text-xs text-white/45">{description}</p>
        {href && !locked && (
          <p className="mt-2 text-xs font-medium text-sky-300/90">Open assessment →</p>
        )}
        {locked && <p className="mt-2 text-xs text-white/30">Locked</p>}
      </div>
    </div>
  );

  if (href && !locked) {
    return (
      <li className="relative">
        {!isFirst && (
          <div className="absolute left-4 -top-4 w-0.5 h-4 bg-gradient-to-b from-white/[0.08] to-sky-400/30" />
        )}
        <Link href={href}>{content}</Link>
        {!isLast && done && (
          <div className="absolute left-4 bottom-0 w-0.5 h-4 bg-gradient-to-b from-emerald-400/30 to-white/[0.08]" />
        )}
      </li>
    );
  }
  return (
    <li className="relative">
      {!isFirst && (
        <div className="absolute left-4 -top-4 w-0.5 h-4 bg-white/[0.06]" />
      )}
      {content}
      {!isLast && done && (
        <div className="absolute left-4 bottom-0 w-0.5 h-4 bg-white/[0.06]" />
      )}
    </li>
  );
}
