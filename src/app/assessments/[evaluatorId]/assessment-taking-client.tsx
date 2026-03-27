"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AssessmentQuestionType, EvaluatorStatus } from "@/generated/prisma/enums";
import { AmbientBackground, GlassCard } from "@/components/cerebral-glass";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TakingPayload } from "../actions";
import { saveDraft, submitEvaluator } from "../actions";

function roleIntro(role: TakingPayload["role"]): string {
  switch (role) {
    case "SELF":
      return "Self-assessment — rate how consistently you demonstrate each behavior.";
    case "PEER":
      return "Peer feedback — rate how consistently you observe these behaviors.";
    case "MANAGER":
      return "Manager feedback — rate how consistently this person demonstrates each behavior.";
    default:
      return "";
  }
}

function groupByCompetency(questions: TakingPayload["questions"]) {
  const map = new Map<string, TakingPayload["questions"]>();
  for (const q of questions) {
    const k = q.competencyKey;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(q);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function SegmentedLikert({
  value,
  onChange,
  disabled,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        className="flex w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-1 shadow-inner"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                "relative min-h-11 flex-1 py-2.5 text-sm font-semibold tabular-nums transition-all duration-300",
                selected ? "text-white" : "text-white/45 hover:text-white/75",
                disabled && "opacity-60",
              )}
            >
              {selected ? (
                <span
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 opacity-95 shadow-[0_0_24px_rgba(99,102,241,0.4)]"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10">{n}</span>
            </button>
          );
        })}
      </div>
      <p className="text-caption-cerebral flex justify-between text-[10px] uppercase">
        <span>Low</span>
        <span>High</span>
      </p>
    </div>
  );
}

export function AssessmentTakingClient({ initial }: { initial: TakingPayload }) {
  const locked = initial.status === EvaluatorStatus.COMPLETED;
  const [answers, setAnswers] = useState<Record<string, { numericValue: number | null; textValue: string | null }>>(
    () => {
      const o: Record<string, { numericValue: number | null; textValue: string | null }> = {};
      for (const q of initial.questions) {
        const r = initial.responses[q.id];
        o[q.id] = {
          numericValue: r?.numericValue ?? null,
          textValue: r?.textValue ?? null,
        };
      }
      return o;
    },
  );
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const likertQuestions = useMemo(
    () => initial.questions.filter((q) => q.questionType === AssessmentQuestionType.LIKERT_360),
    [initial.questions],
  );

  const progress = useMemo(() => {
    const total = likertQuestions.length;
    const answered = likertQuestions.filter((q) => {
      const n = answers[q.id]?.numericValue;
      return typeof n === "number" && !Number.isNaN(n);
    }).length;
    return { answered, total };
  }, [answers, likertQuestions]);

  const grouped = useMemo(() => groupByCompetency(initial.questions), [initial.questions]);

  const flatQuestions = useMemo(() => grouped.flatMap(([, qs]) => qs), [grouped]);

  const [stepIndex, setStepIndex] = useState(0);
  const stepIndexClamped = Math.min(stepIndex, Math.max(0, flatQuestions.length - 1));
  const current = flatQuestions[stepIndexClamped];
  const stepProgress =
    flatQuestions.length > 0 ? ((stepIndexClamped + 1) / flatQuestions.length) * 100 : 0;

  const runSave = useCallback(async () => {
    if (locked) return;
    setSaving(true);
    try {
      const payload: Record<string, { numericValue?: number | null; textValue?: string | null }> = {};
      for (const [qid, v] of Object.entries(answers)) {
        payload[qid] = {
          numericValue: v.numericValue,
          textValue: v.textValue,
        };
      }
      await saveDraft({ evaluatorId: initial.evaluatorId, answers: payload });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save draft");
    } finally {
      setSaving(false);
    }
  }, [answers, initial.evaluatorId, locked]);

  useEffect(() => {
    if (locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void runSave();
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [answers, locked, runSave]);

  async function onSubmit() {
    if (locked) return;
    try {
      await runSave();
      await submitEvaluator(initial.evaluatorId);
      toast.success("Submitted. Thank you.");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    }
  }

  function goPrev() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setStepIndex((i) => Math.min(flatQuestions.length - 1, i + 1));
  }

  if (!current) {
    return (
      <div className="text-white/60 py-16 text-center text-sm">No questions in this assessment.</div>
    );
  }

  const isLast = stepIndexClamped >= flatQuestions.length - 1;

  return (
    <div className="relative min-h-[100dvh] bg-[#0F0F11] text-white">
      <AmbientBackground />

      <header className="border-white/[0.06] bg-[#0F0F11]/75 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption-cerebral truncate">{initial.orgName}</p>
            <h1 className="font-heading text-lg font-semibold tracking-tight text-white/90">{initial.title}</h1>
          </div>
          <Link href="/assessments" className="text-sm text-white/50 transition-colors hover:text-white/90">
            All tasks
          </Link>
        </div>
        <div className="mx-auto mt-3 h-1 max-w-3xl overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(99,102,241,0.45)] transition-[width] duration-500 ease-out"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
        <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
          <span>
            Step {stepIndexClamped + 1} of {flatQuestions.length}
          </span>
          <span className="text-white/35">·</span>
          <span>
            Ratings: {progress.answered}/{progress.total}
          </span>
          {locked ? (
            <span className="text-destructive font-medium">Submitted — locked.</span>
          ) : null}
          {!locked && saving ? <span className="text-white/45">Saving…</span> : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-12rem)] max-w-2xl flex-col justify-center px-4 py-10">
        <p className="text-body-cerebral mb-6 text-center text-sm">{roleIntro(initial.role)}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <GlassCard className="p-6 md:p-8">
              <p className="text-caption-cerebral mb-2">{current.competencyKey}</p>
              <Label className="font-heading mb-6 block text-lg font-semibold leading-snug text-white/90">
                {current.prompt}
              </Label>

              {current.questionType === AssessmentQuestionType.LIKERT_360 && (
                <SegmentedLikert
                  value={answers[current.id]?.numericValue ?? undefined}
                  disabled={locked}
                  onChange={(n) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [current.id]: {
                        ...prev[current.id],
                        numericValue: n,
                        textValue: prev[current.id]?.textValue ?? null,
                      },
                    }))
                  }
                />
              )}

              {(current.questionType === AssessmentQuestionType.TEXT_SHORT ||
                current.questionType === AssessmentQuestionType.FREE_TEXT) && (
                <Textarea
                  disabled={locked}
                  value={answers[current.id]?.textValue ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [current.id]: {
                        numericValue: prev[current.id]?.numericValue ?? null,
                        textValue: e.target.value,
                      },
                    }))
                  }
                  rows={4}
                  placeholder="Optional comments"
                  className="mt-2"
                />
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" disabled={stepIndexClamped === 0} onClick={goPrev}>
            Previous
          </Button>
          {!isLast ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : null}
          {isLast && !locked ? (
            <>
              <Button type="button" variant="outline" onClick={() => void runSave()}>
                Save draft
              </Button>
              <Button type="button" onClick={() => void onSubmit()}>
                Submit final
              </Button>
            </>
          ) : null}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Subject: <span className="text-white/70">{initial.subjectName ?? "—"}</span> · {initial.templateName}
        </p>
      </main>
    </div>
  );
}
