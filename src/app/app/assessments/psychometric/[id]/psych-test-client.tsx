"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { glassCardClassName } from "@/components/cerebral-glass";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AssessmentQuestionType } from "@/generated/prisma/enums";
import { parseQuestionConfig } from "@/lib/question-config";
import {
  parseForcedChoiceConfig,
  parseSemanticConfig,
  type PsychForcedResponse,
  type PsychSemanticResponse,
} from "@/lib/psychometric-scoring";
import { savePsychProgress, submitPsychAttempt } from "../actions";

type QuestionRow = {
  id: string;
  questionType: AssessmentQuestionType;
  config: unknown;
  traitCategory: string | null;
  reverseScored: boolean;
};

function refTraitVote(
  fc: ReturnType<typeof parseForcedChoiceConfig>,
  r: PsychForcedResponse,
): number | null {
  if (!fc.refTrait || fc.psychItemKind !== "consistency" || !fc.consistencyPairKey) return null;
  const refStmt = fc.statements.find((s) => s.trait === fc.refTrait);
  if (!refStmt) return null;
  if (r.mostStatementId === refStmt.id) return 1;
  if (r.leastStatementId === refStmt.id) return -1;
  return 0;
}

function hasConsistencyConflict(
  questions: QuestionRow[],
  responses: Record<string, PsychForcedResponse | PsychSemanticResponse>,
  qid: string,
): boolean {
  const q = questions.find((x) => x.id === qid);
  if (!q || q.questionType !== AssessmentQuestionType.FORCED_CHOICE_IPSATIVE) return false;
  const fc = parseForcedChoiceConfig(q.config);
  if (!fc.consistencyPairKey || !fc.refTrait) return false;
  const r1 = responses[qid] as PsychForcedResponse | undefined;
  if (!r1?.mostStatementId || !r1.leastStatementId) return false;
  const v1 = refTraitVote(fc, r1);
  if (v1 === null || v1 === 0) return false;

  const sibling = questions.find((x) => {
    if (x.id === qid || x.questionType !== AssessmentQuestionType.FORCED_CHOICE_IPSATIVE) return false;
    const o = parseForcedChoiceConfig(x.config);
    return o.consistencyPairKey === fc.consistencyPairKey && o.refTrait === fc.refTrait;
  });
  if (!sibling) return false;
  const r2 = responses[sibling.id] as PsychForcedResponse | undefined;
  if (!r2?.mostStatementId || !r2.leastStatementId) return false;
  const v2 = refTraitVote(parseForcedChoiceConfig(sibling.config), r2);
  if (v2 === null || v2 === 0) return false;
  return v1 !== v2;
}

export function PsychTestClient({
  attemptId,
  templateName,
  itemsPerPage: _itemsPerPage,
  initialQuestionIndex,
  questionCount,
  questions,
  initialResponses,
  initialItemTimings,
}: {
  attemptId: string;
  templateName: string;
  itemsPerPage: number;
  initialQuestionIndex: number;
  questionCount: number;
  questions: QuestionRow[];
  initialResponses: Record<string, PsychForcedResponse | PsychSemanticResponse>;
  initialItemTimings: Record<string, number>;
}) {
  const router = useRouter();
  const [qIdx, setQIdx] = useState(() =>
    Math.min(Math.max(0, initialQuestionIndex), Math.max(0, questionCount - 1)),
  );
  const [responses, setResponses] =
    useState<Record<string, PsychForcedResponse | PsychSemanticResponse>>(initialResponses);
  const [itemTimings, setItemTimings] = useState<Record<string, number>>(initialItemTimings);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQuestionId = useRef<string | null>(null);
  const questionStartedAt = useRef<number>(0);

  const q = questions[qIdx];
  const qid = q?.id;
  const n = questions.length;

  const displayPage = Math.floor(qIdx / _itemsPerPage) + 1;
  const totalDisplayPages = Math.max(1, Math.ceil(n / _itemsPerPage));

  const progressLabel = useMemo(
    () => `Page ${displayPage} of ${totalDisplayPages} · Question ${qIdx + 1} of ${n}`,
    [displayPage, totalDisplayPages, qIdx, n],
  );

  useEffect(() => {
    if (!qid) return;
    if (prevQuestionId.current !== null && prevQuestionId.current !== qid) {
      const dt = Date.now() - questionStartedAt.current;
      setItemTimings((t) => ({ ...t, [prevQuestionId.current!]: dt }));
    }
    prevQuestionId.current = qid;
    questionStartedAt.current = Date.now();
  }, [qid]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const now = Date.now();
      const timings = { ...itemTimings };
      if (qid) {
        timings[qid] = now - questionStartedAt.current;
      }
      void savePsychProgress({
        attemptId,
        responses,
        currentQuestionIndex: qIdx,
        itemTimings: timings,
      }).catch(() => {
        toast.error("Could not save progress");
      });
    }, 700);
  }, [attemptId, responses, qIdx, itemTimings, qid]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [scheduleSave]);

  function patchResponse(id: string, patch: PsychForcedResponse | PsychSemanticResponse) {
    setResponses((r) => {
      const next = { ...r, [id]: patch };
      if (hasConsistencyConflict(questions, next, id)) {
        toast.message("You indicated different preferences earlier — please answer honestly.", {
          duration: 5000,
        });
      }
      return next;
    });
  }

  function setForced(id: string, cur: PsychForcedResponse | undefined, role: "most" | "least", stmtId: string) {
    let most = cur?.mostStatementId ?? "";
    let least = cur?.leastStatementId ?? "";
    if (role === "most") {
      most = stmtId;
      if (least === stmtId) least = "";
    } else {
      least = stmtId;
      if (most === stmtId) most = "";
    }
    patchResponse(id, { mostStatementId: most, leastStatementId: least });
  }

  const currentValid = useMemo(() => {
    if (!q) return false;
    const r = responses[q.id];
    if (q.questionType === AssessmentQuestionType.FORCED_CHOICE_IPSATIVE) {
      const fr = r as PsychForcedResponse | undefined;
      return Boolean(
        fr?.mostStatementId &&
          fr?.leastStatementId &&
          fr.mostStatementId !== fr.leastStatementId,
      );
    }
    if (
      q.questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL ||
      q.questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT
    ) {
      const sr = r as PsychSemanticResponse | undefined;
      return sr?.value !== undefined && !Number.isNaN(sr.value);
    }
    return false;
  }, [q, responses]);

  function goBack() {
    setQIdx((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (!q || !currentValid) return;
    if (qIdx < n - 1) {
      setQIdx((i) => i + 1);
      return;
    }
    void doSubmit();
  }

  async function doSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const timings = { ...itemTimings };
      if (q?.id) timings[q.id] = now - questionStartedAt.current;
      await savePsychProgress({
        attemptId,
        responses,
        currentQuestionIndex: qIdx,
        itemTimings: timings,
      });
      await submitPsychAttempt(attemptId);
      router.push(`/app/assessments/psychometric/${attemptId}/results`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
      setSubmitting(false);
    }
  }

  if (!q) {
    return (
      <div className="bg-[#0F0F11] p-8 text-center text-sm text-white/55">No items in this assessment.</div>
    );
  }

  const parsed = parseQuestionConfig(q.config);

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white">
      <header className="border-white/[0.06] sticky top-0 z-20 border-b bg-[#0F0F11]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-400" />
            <span className="font-heading font-semibold text-white/90">{templateName}</span>
          </div>
          <p className="text-caption-cerebral max-w-[min(100%,18rem)] text-right text-[10px] sm:text-xs">
            {progressLabel}
          </p>
        </div>
        <div className="bg-white/[0.06] h-1.5 w-full overflow-hidden rounded-none">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_14px_rgba(99,102,241,0.35)] transition-all duration-500"
            style={{ width: `${((qIdx + 1) / n) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white/70 backdrop-blur-md">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-indigo-400/90" />
          <span>
            Personality data is sensitive — used only for development insights in this workspace. Take your time; there is
            no timer.
          </span>
        </div>

        <Card className={glassCardClassName()}>
          <CardContent className="space-y-6 pt-6">
            {parsed.richHtml ? (
              <div
                className="prose prose-sm max-w-none text-white/85 prose-invert"
                dangerouslySetInnerHTML={{ __html: parsed.richHtml }}
              />
            ) : null}
            <div>
              <Label className="font-heading text-lg font-semibold leading-relaxed text-white/90">
                {parsed.prompt || " "}
              </Label>
            </div>

            {q.questionType === AssessmentQuestionType.FORCED_CHOICE_IPSATIVE && (
              <ForcedTriad
                questionId={q.id}
                config={q.config}
                value={responses[q.id] as PsychForcedResponse | undefined}
                onPickMost={(stmtId) =>
                  setForced(q.id, responses[q.id] as PsychForcedResponse | undefined, "most", stmtId)
                }
                onPickLeast={(stmtId) =>
                  setForced(q.id, responses[q.id] as PsychForcedResponse | undefined, "least", stmtId)
                }
              />
            )}

            {q.questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL && (
              <SemanticScale
                config={q.config}
                value={(responses[q.id] as PsychSemanticResponse | undefined)?.value}
                onChange={(v) => patchResponse(q.id, { value: v })}
              />
            )}

            {q.questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT && (
              <LikertScale
                value={(responses[q.id] as PsychSemanticResponse | undefined)?.value}
                onChange={(v) => patchResponse(q.id, { value: v })}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button type="button" variant="outline" onClick={goBack} disabled={qIdx === 0 || submitting}>
            <ChevronLeft className="mr-1 size-4" />
            Back
          </Button>
          <Button type="button" onClick={goNext} disabled={!currentValid || submitting}>
            {qIdx < n - 1 ? (
              <>
                Next
                <ChevronRight className="ml-1 size-4" />
              </>
            ) : submitting ? (
              "Submitting…"
            ) : (
              "Finish"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

function ForcedTriad({
  questionId,
  config,
  value,
  onPickMost,
  onPickLeast,
}: {
  questionId: string;
  config: unknown;
  value: PsychForcedResponse | undefined;
  onPickMost: (id: string) => void;
  onPickLeast: (id: string) => void;
}) {
  const { statements } = parseForcedChoiceConfig(config);
  const most = value?.mostStatementId;
  const least = value?.leastStatementId;

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">Choose one Most like you and one Least like you (must differ).</p>
      <div className="space-y-3" role="group" aria-labelledby={`triad-${questionId}`}>
        <div id={`triad-${questionId}`} className="sr-only">
          Forced choice statements
        </div>
        {statements.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm leading-relaxed text-white/85">{s.text}</p>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant={most === s.id ? "default" : "outline"}
                onClick={() => onPickMost(s.id)}
              >
                Most
              </Button>
              <Button
                type="button"
                size="sm"
                variant={least === s.id ? "destructive" : "outline"}
                onClick={() => onPickLeast(s.id)}
              >
                Least
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SemanticScale({
  config,
  value,
  onChange,
}: {
  config: unknown;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const { leftLabel, rightLabel, steps } = parseSemanticConfig(config);
  const nums = Array.from({ length: steps }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-medium text-white/50">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {nums.map((k) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={value === k ? "default" : "outline"}
            onClick={() => onChange(k)}
          >
            {k}
          </Button>
        ))}
      </div>
    </div>
  );
}

function LikertScale({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const labels: Record<number, string> = {
    1: "Strongly disagree",
    2: "Disagree",
    3: "Neutral",
    4: "Agree",
    5: "Strongly agree",
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((k) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={value === k ? "default" : "outline"}
            onClick={() => onChange(k)}
          >
            {k}
          </Button>
        ))}
      </div>
      {value ? <p className="text-xs text-white/50">{labels[value]}</p> : null}
    </div>
  );
}
