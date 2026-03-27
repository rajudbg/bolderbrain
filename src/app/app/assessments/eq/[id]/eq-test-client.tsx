"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Heart, Leaf } from "lucide-react";
import { glassCardClassName } from "@/components/cerebral-glass";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AssessmentQuestionType } from "@/generated/prisma/enums";
import { parseQuestionConfig } from "@/lib/question-config";
import { parseEqScenarioOptions } from "@/lib/eq-question-config";
import type { EqResponseEntry } from "@/lib/eq-scoring";
import type { EqSectionPayload } from "../actions";
import { saveEqProgress, submitEqAttempt } from "../actions";

const LIKERT_LABELS: Record<number, string> = {
  1: "Strongly disagree",
  2: "Disagree",
  3: "Somewhat disagree",
  4: "Neutral",
  5: "Somewhat agree",
  6: "Agree",
  7: "Strongly agree",
};

export function EqTestClient({
  attemptId,
  templateName,
  sections,
  initialResponses,
  initialSectionIndex,
}: {
  attemptId: string;
  templateName: string;
  sections: EqSectionPayload[];
  initialResponses: Record<string, EqResponseEntry>;
  initialSectionIndex: number;
}) {
  const router = useRouter();
  const [sectionIdx, setSectionIdx] = useState(() =>
    Math.min(initialSectionIndex, Math.max(0, sections.length - 1)),
  );
  const [qIdx, setQIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, EqResponseEntry>>(initialResponses);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const section = sections[sectionIdx];
  const question = section?.questions[qIdx];
  const totalSections = sections.length;

  const progressLabel = useMemo(() => {
    if (!section) return "";
    return `Section ${sectionIdx + 1} of ${totalSections}: ${section.label}`;
  }, [section, sectionIdx, totalSections]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveEqProgress({
        attemptId,
        responses,
        currentSectionIndex: sectionIdx,
      }).catch(() => {
        toast.error("Could not save progress");
      });
    }, 700);
  }, [attemptId, responses, sectionIdx]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [scheduleSave]);

  function setResponse(questionId: string, patch: EqResponseEntry) {
    setResponses((r) => ({ ...r, [questionId]: { ...r[questionId], ...patch } }));
  }

  function goBack() {
    if (qIdx > 0) {
      setQIdx((i) => i - 1);
      return;
    }
    if (sectionIdx > 0) {
      const prev = sections[sectionIdx - 1]!;
      setSectionIdx((s) => s - 1);
      setQIdx(Math.max(0, prev.questions.length - 1));
    }
  }

  function goNext() {
    if (!section || !question) return;
    if (qIdx < section.questions.length - 1) {
      setQIdx((i) => i + 1);
      return;
    }
    if (sectionIdx < sections.length - 1) {
      setReflectionOpen(true);
      return;
    }
    void doSubmit();
  }

  function continueAfterReflection() {
    setReflectionOpen(false);
    setSectionIdx((s) => s + 1);
    setQIdx(0);
  }

  async function doSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveEqProgress({
        attemptId,
        responses,
        currentSectionIndex: sectionIdx,
      });
      await submitEqAttempt(attemptId);
      router.push(`/app/assessments/eq/${attemptId}/results`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
      setSubmitting(false);
    }
  }

  if (!section || !question) {
    return (
      <div className="text-white/55 bg-[#0F0F11] p-8 text-center text-sm">
        No questions in this assessment.
      </div>
    );
  }

  const parsed = parseQuestionConfig(question.config);
  const scenarioOpts = parseEqScenarioOptions(question.config);

  return (
    <div className="relative min-h-screen bg-[#0F0F11] text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-[15%] top-[20%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full bg-amber-600/12 blur-[100px]" />
        <div className="absolute -right-[10%] bottom-[15%] h-[min(50vw,380px)] w-[min(50vw,380px)] rounded-full bg-orange-600/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,rgba(251,146,60,0.06),transparent)]" />
      </div>
      <header className="border-white/[0.06] bg-[#0F0F11]/80 sticky top-0 z-20 border-b px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-amber-400" aria-hidden />
            <span className="font-heading font-semibold text-white/90">{templateName}</span>
          </div>
          <p className="text-caption-cerebral max-w-[min(100%,20rem)] text-right text-[10px] sm:text-xs">
            {progressLabel}
          </p>
        </div>
        <div className="bg-white/[0.06] mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-[0_0_14px_rgba(251,146,60,0.35)] transition-all duration-500"
            style={{
              width: `${((sectionIdx + (qIdx + 1) / section.questions.length) / totalSections) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${sectionIdx}-${qIdx}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <Card className={glassCardClassName("border-amber-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.45)]")}>
              <CardContent className="space-y-6 pt-6">
                {parsed.richHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-white/85 prose-invert"
                    dangerouslySetInnerHTML={{ __html: parsed.richHtml }}
                  />
                ) : null}
                <div>
                  <Label className="font-heading text-lg font-semibold leading-relaxed text-white/90">
                    {parsed.prompt}
                  </Label>
                </div>

                {question.questionType === AssessmentQuestionType.EQ_SCENARIO && (
                  <div className="space-y-3">
                    <p className="text-caption-cerebral text-[10px]">Hover an option to see why it matters</p>
                    <div className="space-y-2" role="radiogroup">
                      {scenarioOpts.map((opt) => {
                        const sel = responses[question.id]?.scenarioOptionId === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "group flex cursor-pointer flex-col gap-0 overflow-hidden rounded-2xl border p-3 text-sm transition-all duration-300",
                              sel
                                ? "border-amber-400/45 bg-gradient-to-br from-amber-500/15 to-orange-500/10 shadow-[0_0_20px_rgba(251,146,60,0.15)]"
                                : "border-white/10 bg-white/[0.02] hover:border-amber-500/25 hover:bg-amber-500/[0.06]",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name={`sc-${question.id}`}
                                checked={sel}
                                onChange={() => setResponse(question.id, { scenarioOptionId: opt.id })}
                                className="mt-1 border-white/20 text-amber-500"
                              />
                              <span className="leading-snug text-white/88">{opt.label}</span>
                            </div>
                            <div
                              className={cn(
                                "grid transition-[grid-template-rows] duration-300 ease-out",
                                "grid-rows-[0fr] group-hover:grid-rows-[1fr]",
                              )}
                            >
                              <div className="min-h-0 overflow-hidden">
                                <p className="text-white/55 mt-2 border-t border-amber-500/15 pt-2 text-xs leading-relaxed">
                                  <span className="font-medium text-amber-200/90">Why this matters: </span>
                                  {opt.rationale ||
                                    "Consider how this choice shows up in your real work relationships."}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {responses[question.id]?.scenarioOptionId ? (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/25 p-3 text-sm text-white/75">
                        <p className="font-heading text-amber-200/95 font-medium">Reflection</p>
                        <p className="mt-1">
                          {scenarioOpts.find((o) => o.id === responses[question.id]?.scenarioOptionId)
                            ?.rationale ||
                            "Consider how this choice shows up in your real work relationships."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                {question.questionType === AssessmentQuestionType.EQ_SELF_REPORT && (
                  <div className="space-y-3">
                    <p className="text-caption-cerebral text-[10px]">1 = Strongly disagree · 7 = Strongly agree</p>
                    <div className="flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                        const sel = responses[question.id]?.likert === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={sel}
                            onClick={() => setResponse(question.id, { likert: n })}
                            className={cn(
                              "relative min-h-10 flex-1 py-2 text-xs font-semibold tabular-nums transition-all duration-300 sm:text-sm",
                              sel ? "text-white" : "text-white/45 hover:text-white/75",
                            )}
                          >
                            {sel ? (
                              <span
                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-95 shadow-[0_0_18px_rgba(251,146,60,0.35)]"
                                aria-hidden
                              />
                            ) : null}
                            <span className="relative z-10">{n}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="min-h-[1.25rem] text-xs text-white/55">
                      {responses[question.id]?.likert
                        ? LIKERT_LABELS[responses[question.id]!.likert!]
                        : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={sectionIdx === 0 && qIdx === 0}
            className="gap-1"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <div className="text-xs text-white/45">
            Question {qIdx + 1} of {section.questions.length} in this section
          </div>
          {sectionIdx === sections.length - 1 && qIdx === section.questions.length - 1 ? (
            <Button type="button" disabled={submitting} onClick={() => void doSubmit()}>
              {submitting ? "Submitting…" : "Finish & view results"}
            </Button>
          ) : (
            <Button type="button" className="gap-1" onClick={goNext}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </main>

      <Dialog open={reflectionOpen} onOpenChange={setReflectionOpen}>
        <DialogContent className="border-white/10 bg-[#1A1A1E]/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-white/90">
              <Leaf className="size-5 text-amber-400" />
              Reflection pause
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-white/65">
              You&apos;re moving to the next area of emotional intelligence. Take a slow breath — EQ grows with
              curiosity, not speed. When you&apos;re ready, continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={continueAfterReflection}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
