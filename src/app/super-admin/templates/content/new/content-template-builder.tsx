"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  TrainingContentQuestionType,
  TrainingContentTemplateKind,
} from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrainingContentTemplate } from "@/app/super-admin/training-content/actions";
import { cn } from "@/lib/utils";

const AGREEMENT_LIKERT = [
  { text: "Strongly disagree", value: 1 },
  { text: "Disagree", value: 2 },
  { text: "Neutral", value: 3 },
  { text: "Agree", value: 4 },
  { text: "Strongly agree", value: 5 },
];

function emptyKnowledgeOptions(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    text: `Option ${String.fromCharCode(65 + i)}`,
    value: i,
  }));
}

type QState = {
  text: string;
  type: TrainingContentQuestionType;
  options: { text: string; value: number }[];
  correctOptionIndexes: number[];
  points: number;
  explanation: string;
  competencyKey: string;
  reverseScored: boolean;
};

function defaultQuestion(kind: TrainingContentTemplateKind): QState {
  if (kind === TrainingContentTemplateKind.KNOWLEDGE_TEST) {
    return {
      text: "",
      type: TrainingContentQuestionType.SINGLE_CHOICE,
      options: emptyKnowledgeOptions(4),
      correctOptionIndexes: [0],
      points: 1,
      explanation: "",
      competencyKey: "",
      reverseScored: false,
    };
  }
  return {
    text: "",
    type: TrainingContentQuestionType.LIKERT_5_SCALE,
    options: AGREEMENT_LIKERT.map((o) => ({ ...o })),
    correctOptionIndexes: [],
    points: 1,
    explanation: "",
    competencyKey: "",
    reverseScored: false,
  };
}

export function ContentTemplateBuilder() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("Advanced Negotiation Knowledge Check");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TrainingContentTemplateKind>(TrainingContentTemplateKind.KNOWLEDGE_TEST);
  const [defaultQuestionCount, setDefaultQuestionCount] = useState(20);
  const [hasTimer, setHasTimer] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [defaultOptionCount, setDefaultOptionCount] = useState(4);
  const [questions, setQuestions] = useState<QState[]>(() =>
    Array.from({ length: 5 }, () => defaultQuestion(TrainingContentTemplateKind.KNOWLEDGE_TEST)),
  );

  const isKnowledge = kind === TrainingContentTemplateKind.KNOWLEDGE_TEST;

  const canRemove = questions.length > 5;

  const selectedKindLabel = useMemo(() => {
    if (kind === TrainingContentTemplateKind.KNOWLEDGE_TEST) return "Knowledge test";
    if (kind === TrainingContentTemplateKind.BEHAVIORAL_TEST) return "Behavioral (Likert)";
    return kind;
  }, [kind]);

  const getQuestionTypeLabel = (type: TrainingContentQuestionType) => {
    if (isKnowledge) {
      if (type === TrainingContentQuestionType.SINGLE_CHOICE) return "Single choice";
      if (type === TrainingContentQuestionType.MULTIPLE_CHOICE) return "Multiple choice";
    } else {
      if (type === TrainingContentQuestionType.LIKERT_5_SCALE) return "5-point agreement";
      if (type === TrainingContentQuestionType.LIKERT_FREQUENCY) return "5-point frequency";
      if (type === TrainingContentQuestionType.SEMANTIC_DIFFERENTIAL) return "Semantic scale";
    }
    return type;
  };

  const addQuestion = () => {
    if (questions.length >= 50) {
      toast.error("Maximum 50 questions allowed");
      return;
    }
    setQuestions((qs) => [...qs, defaultQuestion(kind)]);
  };

  const removeQuestion = (i: number) => {
    if (!canRemove) {
      toast.error("Minimum 5 questions");
      return;
    }
    setQuestions((qs) => qs.filter((_, j) => j !== i));
  };

  const updateQuestion = (i: number, patch: Partial<QState>) => {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  };

  const setOptionCount = (qi: number, n: number) => {
    const q = questions[qi]!;
    const next = Math.min(6, Math.max(3, n));
    const opts = [...q.options].slice(0, next);
    while (opts.length < next) {
      opts.push({ text: `Option ${opts.length + 1}`, value: opts.length });
    }
    let correct = q.correctOptionIndexes.filter((c) => c < next);
    if (correct.length === 0) correct = [0];
    if (q.type === TrainingContentQuestionType.SINGLE_CHOICE) correct = [correct[0] ?? 0];
    updateQuestion(qi, { options: opts, correctOptionIndexes: correct });
  };

  const validationHint = useMemo(() => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.text.trim()) return `Question ${i + 1}: add prompt text`;
      if (isKnowledge) {
        if (q.correctOptionIndexes.length < 1) return `Question ${i + 1}: mark a correct answer`;
        if (q.type === TrainingContentQuestionType.SINGLE_CHOICE && q.correctOptionIndexes.length !== 1) {
          return `Question ${i + 1}: single choice needs exactly one correct option`;
        }
      }
    }
    return null;
  }, [questions, isKnowledge]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationHint) {
      toast.error(validationHint);
      return;
    }
    setPending(true);
    try {
      await createTrainingContentTemplate({
        name,
        description: description || undefined,
        kind,
        organizationId: null,
        minQuestions: 5,
        maxQuestions: 50,
        defaultQuestionCount,
        hasTimer: isKnowledge ? hasTimer : false,
        timeLimitMinutes: isKnowledge && hasTimer ? timeLimitMinutes : null,
        defaultOptionCount,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type,
          points: q.points,
          competencyKey: q.competencyKey.trim() || undefined,
          reverseScored: q.reverseScored,
          explanation: q.explanation.trim() || undefined,
          minOptions: 3,
          maxOptions: 6,
          options: q.options.map((o) => ({ text: o.text.trim(), value: o.value })),
          correctOptionIndexes: isKnowledge ? q.correctOptionIndexes : [],
        })),
      });
      toast.success("Template published");
      router.push("/super-admin/templates");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10 rounded-[2rem] border border-white/[0.12] bg-[#0F0F11]/95 p-6 md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/80">Template name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="border-white/10 bg-white/[0.05] text-white/90" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-white/80">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Type</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              const k = v as TrainingContentTemplateKind;
              setKind(k);
              setQuestions((qs) => qs.map(() => defaultQuestion(k)));
            }}
          >
            <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
              <SelectValue>
                {selectedKindLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-white/12 bg-[#161618] text-white/95">
              <SelectItem value={TrainingContentTemplateKind.KNOWLEDGE_TEST}>Knowledge test</SelectItem>
              <SelectItem value={TrainingContentTemplateKind.BEHAVIORAL_TEST}>Behavioral (Likert)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Default question count (programs)</Label>
          <Input
            type="number"
            min={5}
            max={50}
            value={defaultQuestionCount}
            onChange={(e) => setDefaultQuestionCount(Number.parseInt(e.target.value, 10) || 5)}
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        {isKnowledge && (
          <>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="timer"
                checked={hasTimer}
                onChange={(e) => setHasTimer(e.target.checked)}
                className="size-4 accent-amber-500"
              />
              <Label htmlFor="timer" className="text-white/80">
                Enable time limit
              </Label>
            </div>
            {hasTimer && (
              <div className="space-y-2">
                <Label className="text-white/80">Minutes (5–180)</Label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number.parseInt(e.target.value, 10) || 30)}
                  className="border-white/10 bg-white/[0.05] text-white/90"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-white/80">Default options per question</Label>
              <Input
                type="number"
                min={3}
                max={6}
                value={defaultOptionCount}
                onChange={(e) => setDefaultOptionCount(Number.parseInt(e.target.value, 10) || 4)}
                className="border-white/10 bg-white/[0.05] text-white/90"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg text-white/90">Questions ({questions.length})</h2>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-2 border-white/15">
            <Plus className="size-4" />
            Add question
          </Button>
        </div>

        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/35">Question {qi + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canRemove}
                  onClick={() => removeQuestion(qi)}
                  className="text-white/40 hover:text-red-300"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/70">Prompt</Label>
                  <Textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    rows={2}
                    className="border-white/10 bg-white/[0.05] text-white/90"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/70">Question type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(v) => {
                        const t = v as TrainingContentQuestionType;
                        if (
                          isKnowledge &&
                          (t === TrainingContentQuestionType.SINGLE_CHOICE || t === TrainingContentQuestionType.MULTIPLE_CHOICE)
                        ) {
                          updateQuestion(qi, {
                            type: t,
                            correctOptionIndexes: t === TrainingContentQuestionType.SINGLE_CHOICE ? [0] : [0],
                          });
                        }
                        if (!isKnowledge) {
                          if (t === TrainingContentQuestionType.LIKERT_FREQUENCY) {
                            updateQuestion(qi, {
                              type: t,
                              options: [
                                { text: "Never", value: 1 },
                                { text: "Rarely", value: 2 },
                                { text: "Sometimes", value: 3 },
                                { text: "Often", value: 4 },
                                { text: "Always", value: 5 },
                              ],
                            });
                          } else if (t === TrainingContentQuestionType.LIKERT_5_SCALE) {
                            updateQuestion(qi, { type: t, options: AGREEMENT_LIKERT.map((o) => ({ ...o })) });
                          } else {
                            updateQuestion(qi, { type: t, options: AGREEMENT_LIKERT.map((o) => ({ ...o })) });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                        <SelectValue>
                          {getQuestionTypeLabel(q.type)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border border-white/12 bg-[#161618] text-white/95">
                        {isKnowledge ? (
                          <>
                            <SelectItem value={TrainingContentQuestionType.SINGLE_CHOICE}>Single choice</SelectItem>
                            <SelectItem value={TrainingContentQuestionType.MULTIPLE_CHOICE}>Multiple choice</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value={TrainingContentQuestionType.LIKERT_5_SCALE}>5-point agreement</SelectItem>
                            <SelectItem value={TrainingContentQuestionType.LIKERT_FREQUENCY}>5-point frequency</SelectItem>
                            <SelectItem value={TrainingContentQuestionType.SEMANTIC_DIFFERENTIAL}>Semantic scale</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {isKnowledge && (
                    <div className="space-y-2">
                      <Label className="text-white/70">Points</Label>
                      <Input
                        type="number"
                        min={0}
                        value={q.points}
                        onChange={(e) => updateQuestion(qi, { points: Number.parseInt(e.target.value, 10) || 0 })}
                        className="border-white/10 bg-white/[0.05] text-white/90"
                      />
                    </div>
                  )}
                </div>

                {isKnowledge && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-white/70">Options (3–6)</Label>
                      <Input
                        type="number"
                        min={3}
                        max={6}
                        className="w-24 border-white/10 bg-white/[0.05] text-white/90"
                        value={q.options.length}
                        onChange={(e) => setOptionCount(qi, Number.parseInt(e.target.value, 10) || 3)}
                      />
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex flex-wrap items-center gap-2">
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const next = [...q.options];
                              next[oi] = { ...next[oi]!, text: e.target.value };
                              updateQuestion(qi, { options: next });
                            }}
                            className="min-w-[200px] flex-1 border-white/10 bg-white/[0.05] text-white/90"
                          />
                          {q.type === TrainingContentQuestionType.SINGLE_CHOICE ? (
                            <label className="flex items-center gap-2 text-xs text-white/55">
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={q.correctOptionIndexes[0] === oi}
                                onChange={() => updateQuestion(qi, { correctOptionIndexes: [oi] })}
                                className="accent-emerald-500"
                              />
                              Correct
                            </label>
                          ) : (
                            <label className="flex items-center gap-2 text-xs text-white/55">
                              <input
                                type="checkbox"
                                checked={q.correctOptionIndexes.includes(oi)}
                                onChange={(e) => {
                                  const set = new Set(q.correctOptionIndexes);
                                  if (e.target.checked) set.add(oi);
                                  else set.delete(oi);
                                  updateQuestion(qi, { correctOptionIndexes: [...set].sort((a, b) => a - b) });
                                }}
                                className="accent-emerald-500"
                              />
                              Correct
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isKnowledge && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/70">Competency tag (optional)</Label>
                      <Input
                        value={q.competencyKey}
                        onChange={(e) => updateQuestion(qi, { competencyKey: e.target.value })}
                        className="border-white/10 bg-white/[0.05] text-white/90"
                        placeholder="e.g. leadership"
                      />
                    </div>
                    <label className="mt-6 flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={q.reverseScored}
                        onChange={(e) => updateQuestion(qi, { reverseScored: e.target.checked })}
                        className="accent-amber-500"
                      />
                      Reverse scored
                    </label>
                  </div>
                )}

                {isKnowledge && (
                  <div className="space-y-2">
                    <Label className="text-white/70">Explanation (after answer)</Label>
                    <Textarea
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                      rows={2}
                      className="border-white/10 bg-white/[0.05] text-white/90"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending || !!validationHint}
          className={cn("bg-gradient-to-r from-indigo-500 to-violet-600 text-white", validationHint && "opacity-60")}
        >
          {pending ? "Publishing…" : "Publish template"}
        </Button>
        {validationHint && <p className="text-sm text-amber-200/80">{validationHint}</p>}
      </div>
    </form>
  );
}
