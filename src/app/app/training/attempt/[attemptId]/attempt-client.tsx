"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TrainingContentTemplateKind, TrainingContentQuestionType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { TrainingQuestionCard } from "@/components/training/training-question-card";
import { TrainingTimer } from "@/components/training/training-timer";
import {
  saveTrainingAttemptDraft,
  submitTrainingAttempt,
  type AttemptResponseVal,
  type TrainingAttemptView,
} from "../../training-attempt-actions";

function firstUnansweredIndex(
  questions: TrainingAttemptView["questions"],
  draft: Record<string, AttemptResponseVal>,
): number {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const r = draft[q.id];
    if (!r?.selectedOptionIds?.length) return i;
  }
  return 0;
}

export function TrainingAttemptClient({ initial }: { initial: TrainingAttemptView }) {
  const router = useRouter();
  const responsesRef = useRef<Record<string, AttemptResponseVal>>(initial.draftResponses);
  const [responses, setResponses] = useState<Record<string, AttemptResponseVal>>(() => ({
    ...initial.draftResponses,
  }));
  const [idx, setIdx] = useState(() => firstUnansweredIndex(initial.questions, initial.draftResponses));
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);

  responsesRef.current = responses;

  const q = initial.questions[idx];
  const total = initial.questions.length;
  const isKnowledge = initial.kind === TrainingContentTemplateKind.KNOWLEDGE_TEST;

  const selectedIds = useMemo(() => responses[q?.id ?? ""]?.selectedOptionIds ?? [], [q?.id, responses]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void saveTrainingAttemptDraft(initial.attemptId, responsesRef.current).catch(() => {
        /* offline / session */
      });
    }, 750);
    return () => window.clearTimeout(t);
  }, [responses, initial.attemptId]);

  const validateCurrent = useCallback((): boolean => {
    if (!q) return false;
    const r = responses[q.id];
    if (isKnowledge) {
      const ids = r?.selectedOptionIds ?? [];
      if (ids.length === 0) {
        toast.error("Select an answer to continue.");
        return false;
      }
      if (q.type === TrainingContentQuestionType.SINGLE_CHOICE && ids.length !== 1) {
        toast.error("Select one option.");
        return false;
      }
      return true;
    }
    const ids = r?.selectedOptionIds ?? [];
    if (ids.length === 0) {
      toast.error("Select a response to continue.");
      return false;
    }
    return true;
  }, [isKnowledge, q, responses]);

  const runSubmit = useCallback(
    async (opts?: { timerExpired?: boolean }) => {
      const force = opts?.timerExpired === true;
      const snap = responsesRef.current;

      if (!force) {
        for (const qq of initial.questions) {
          const r = snap[qq.id];
          const ids = r?.selectedOptionIds ?? [];
          if (ids.length === 0) {
            toast.error(`Answer every question before submitting.`);
            setIdx(firstUnansweredIndex(initial.questions, snap));
            return;
          }
          if (isKnowledge && qq.type === TrainingContentQuestionType.SINGLE_CHOICE && ids.length !== 1) {
            toast.error("Single-choice questions need exactly one answer.");
            return;
          }
        }
      }

      setPending(true);
      try {
        const payload: Record<string, AttemptResponseVal> = {};
        for (const qq of initial.questions) {
          const r = snap[qq.id];
          if (r) payload[qq.id] = r;
        }
        await submitTrainingAttempt(initial.attemptId, payload);
        if (force) {
          toast.message("Time expired — submitted with your answers so far.");
        } else {
          toast.success("Submitted");
        }
        router.push(`/app/training/${initial.programId}/results`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Submit failed");
      } finally {
        setPending(false);
      }
    },
    [initial.attemptId, initial.programId, initial.questions, isKnowledge, router],
  );

  const onTimerExpire = useCallback(() => {
    void runSubmit({ timerExpired: true });
  }, [runSubmit]);

  const goNext = useCallback(() => {
    if (!validateCurrent()) return;
    if (idx < total - 1) setIdx((i) => i + 1);
    else void runSubmit();
  }, [idx, runSubmit, total, validateCurrent]);

  const goPrev = useCallback(() => {
    if (idx > 0) setIdx((i) => i - 1);
  }, [idx]);

  if (!q) {
    return <p className="text-sm text-white/60">No questions in this attempt.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/40">
            {initial.phaseLabel}
          </p>
          <h1 className="font-heading text-xl font-semibold text-white/95">{initial.programName}</h1>
        </div>
        {initial.endsAt && isKnowledge ? <TrainingTimer endsAt={initial.endsAt} onExpire={onTimerExpire} /> : null}
      </div>

      <TrainingQuestionCard
        index={idx}
        total={total}
        text={q.text}
        type={q.type}
        options={q.options}
        selectedIds={selectedIds}
        onChangeSelected={(ids) => {
          setResponses((prev) => {
            const next = { ...prev, [q.id]: { selectedOptionIds: ids } };
            return next;
          });
        }}
        flagged={flagged[q.id]}
        onFlag={(v) => setFlagged((prev) => ({ ...prev, [q.id]: v }))}
      />

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" disabled={idx === 0 || pending} onClick={goPrev}>
          Previous
        </Button>
        <div className="flex gap-2">
          {idx < total - 1 ? (
            <Button type="button" className="bg-indigo-500/90 text-white hover:bg-indigo-400" disabled={pending} onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-amber-500/90 text-black hover:bg-amber-400"
              disabled={pending}
              onClick={() => void runSubmit()}
            >
              {pending ? "Submitting…" : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
