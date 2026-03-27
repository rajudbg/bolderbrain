"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Expand, Flag } from "lucide-react";
import { AmbientBackground } from "@/components/cerebral-glass";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseQuestionConfig } from "@/lib/question-config";
import { questionTypeLabel } from "@/lib/assessment-question-types";
import { cn } from "@/lib/utils";
import type { IqAttemptPayload } from "../actions";
import { submitIqAttempt } from "../actions";

function formatRemain(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function TimerRing({
  remainSec,
  totalSec,
  urgent,
}: {
  remainSec: number;
  totalSec: number;
  urgent: boolean;
}) {
  const size = 92;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = totalSec > 0 ? Math.min(1, Math.max(0, remainSec / totalSec)) : 0;
  const offset = c * (1 - pct);
  const gradId = "iq-timer-ring-grad";

  return (
    <div className={cn("relative shrink-0", urgent && "cerebral-timer-urgent")}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={urgent ? "#f87171" : "#6366f1"} />
            <stop offset="50%" stopColor={urgent ? "#fb923c" : "#a855f7"} />
            <stop offset="100%" stopColor={urgent ? "#fbbf24" : "#ec4899"} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{ filter: urgent ? "drop-shadow(0 0 10px rgba(239,68,68,0.6))" : undefined }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className={cn("font-data text-lg font-semibold tabular-nums", urgent ? "text-red-300" : "text-white/95")}>
          {formatRemain(remainSec)}
        </p>
      </div>
    </div>
  );
}

export function IqTestClient({ payload }: { payload: IqAttemptPayload }) {
  const router = useRouter();
  const { attempt, questions, defaults } = payload;
  const n = questions.length;

  const totalSec = useMemo(
    () =>
      Math.max(
        60,
        Math.floor(
          (new Date(attempt.endsAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000,
        ),
      ),
    [attempt.endsAt, attempt.startedAt],
  );

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<"linear" | "review">("linear");
  const [reviewPos, setReviewPos] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [remainSec, setRemainSec] = useState(() =>
    Math.max(0, Math.floor((new Date(attempt.endsAt).getTime() - Date.now()) / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const tabWarned = useRef(false);
  const submittedOnce = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const responsesRef = useRef(responses);
  const flaggedListRef = useRef<string[]>([]);

  const flaggedList = useMemo(
    () => questions.filter((q) => flagged.has(q.id)).map((q) => q.id),
    [questions, flagged],
  );

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    flaggedListRef.current = flaggedList;
  }, [flaggedList]);

  const submit = useCallback(async () => {
    if (submittedOnce.current) return;
    submittedOnce.current = true;
    setSubmitting(true);
    try {
      const fl = flaggedListRef.current;
      await submitIqAttempt({
        attemptId: attempt.id,
        responses: responsesRef.current,
        flaggedIds: fl.length ? fl : undefined,
      });
      router.push(`/app/assessments/iq/${attempt.id}/results`);
      router.refresh();
    } catch (e) {
      submittedOnce.current = false;
      toast.error(e instanceof Error ? e.message : "Submit failed");
      setSubmitting(false);
    }
  }, [attempt.id, router]);

  useEffect(() => {
    const ends = new Date(attempt.endsAt).getTime();
    function tick() {
      const sec = Math.max(0, Math.floor((ends - Date.now()) / 1000));
      setRemainSec(sec);
      if (sec <= 0) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        void submit();
      }
    }
    intervalRef.current = window.setInterval(tick, 1000);
    tick();
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [attempt.endsAt, submit]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "hidden" && !tabWarned.current) {
        tabWarned.current = true;
        toast.warning(
          "Stay in this tab until you finish — switching away may invalidate the session in higher-stakes deployments.",
          { duration: 6000 },
        );
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  async function requestFs() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.message("Fullscreen is not available in this browser.");
    }
  }

  const current =
    step === "linear"
      ? questions[index]
      : questions.find((q) => q.id === flaggedList[reviewPos]);

  const parsed = current ? parseQuestionConfig(current.config) : null;
  const progressPct = step === "linear" ? ((index + 1) / n) * 100 : 100;

  function toggleFlag() {
    if (!current) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  }

  function nextLinear() {
    if (index < n - 1) {
      setIndex((i) => i + 1);
      return;
    }
    if (flaggedList.length > 0) {
      setStep("review");
      setReviewPos(0);
      return;
    }
    void submit();
  }

  function nextReview() {
    if (reviewPos < flaggedList.length - 1) {
      setReviewPos((p) => p + 1);
      return;
    }
    void submit();
  }

  function prevReview() {
    if (reviewPos > 0) setReviewPos((p) => p - 1);
  }

  if (!current || !parsed) return null;

  const qTime = current.timeLimitSeconds ?? defaults.defaultQuestionTimeSeconds;
  const urgent = remainSec > 0 && remainSec <= 10;

  return (
    <div className="bg-[#0F0F11] fixed inset-0 z-50 flex flex-col text-white">
      <AmbientBackground />

      <header className="border-white/[0.06] relative z-10 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <TimerRing remainSec={remainSec} totalSec={totalSec} urgent={urgent} />
          <div className="min-w-0">
            <p className="text-caption-cerebral">Session time</p>
            <p className="text-body-cerebral text-sm">Cognitive assessment · focus on the prompt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => void requestFs()}>
            <Expand className="size-4" />
            Fullscreen
          </Button>
        </div>
      </header>

      <div className="border-white/[0.04] relative z-10 border-b px-4 py-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 text-sm">
          <span className="text-white/55">
            {step === "linear" ? (
              <>
                Question {index + 1} of {n}
              </>
            ) : (
              <>
                Review flagged · {reviewPos + 1} of {flaggedList.length}
              </>
            )}
          </span>
          <span className="text-white/40 text-xs">{questionTypeLabel(current.questionType)}</span>
        </div>
        <div className="bg-white/[0.06] mx-auto mt-2 h-1.5 max-w-3xl overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_18px_rgba(99,102,241,0.45)] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + step}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="select-none space-y-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-7"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
            >
              {parsed.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={parsed.imageUrl}
                  alt=""
                  className="max-h-64 w-auto rounded-xl border border-white/10 object-contain"
                />
              ) : null}
              {parsed.richHtml ? (
                <div
                  className="prose prose-sm max-w-none border-l-2 border-indigo-500/40 pl-4 text-white/85 prose-invert"
                  dangerouslySetInnerHTML={{ __html: parsed.richHtml }}
                />
              ) : null}
              <div>
                <Label className="font-heading text-lg font-semibold leading-relaxed text-white/90">
                  {parsed.prompt || "Question"}
                </Label>
                <p className="font-data mt-1 text-xs text-white/45">Suggested time · {qTime}s</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="grid gap-3 sm:grid-cols-1" role="radiogroup" aria-label="Answer choices">
            {parsed.options.map((opt) => {
              const sel = responses[current.id] === opt.id;
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "will-change-transform flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300",
                    "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg",
                    sel &&
                      "border-indigo-400/50 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10 shadow-[0_0_24px_rgba(99,102,241,0.2)]",
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    value={opt.id}
                    checked={sel}
                    onChange={() => setResponses((r) => ({ ...r, [current.id]: opt.id }))}
                    className="border-white/20 text-indigo-500 mt-1 size-4"
                  />
                  <span className="text-sm leading-snug text-white/85">{opt.label}</span>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
            <Button
              type="button"
              variant={flagged.has(current.id) ? "secondary" : "outline"}
              className="gap-2"
              onClick={toggleFlag}
            >
              <Flag className="size-4" />
              {flagged.has(current.id) ? "Unflag" : "Flag for review"}
            </Button>
            <div className="text-white/45 flex items-center gap-1 text-xs">
              <AlertTriangle className="size-3.5 shrink-0" />
              No back navigation — use flags to revisit before submit.
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-3xl justify-end gap-3 pb-8">
          {step === "review" ? (
            <>
              <Button type="button" variant="outline" disabled={reviewPos === 0} onClick={prevReview}>
                Previous (flagged)
              </Button>
              <Button type="button" onClick={nextReview} disabled={submitting}>
                {reviewPos < flaggedList.length - 1 ? "Next flagged" : submitting ? "Submitting…" : "Submit test"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={nextLinear} disabled={submitting}>
              {index < n - 1
                ? "Next"
                : flaggedList.length > 0
                  ? "Continue to review"
                  : submitting
                    ? "Submitting…"
                    : "Submit test"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
