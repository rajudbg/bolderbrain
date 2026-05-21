"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Check, Sparkles, Loader2, ChevronRight } from "lucide-react";
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
  id: string;
  text: string;
  type: TrainingContentQuestionType;
  options: { text: string; value: number }[];
  correctOptionIndexes: number[];
  points: number;
  explanation: string;
  competencyKey: string;
  reverseScored: boolean;
};

let qidCounter = 0;
function freshQuestion(kind: TrainingContentTemplateKind, optionCount: number): QState {
  const id = `q_${++qidCounter}`;
  if (kind === TrainingContentTemplateKind.KNOWLEDGE_TEST) {
    return {
      id,
      text: "",
      type: TrainingContentQuestionType.SINGLE_CHOICE,
      options: emptyKnowledgeOptions(optionCount),
      correctOptionIndexes: [0],
      points: 1,
      explanation: "",
      competencyKey: "",
      reverseScored: false,
    };
  }
  return {
    id,
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TrainingContentTemplateKind>(TrainingContentTemplateKind.KNOWLEDGE_TEST);
  const [questionCount, setQuestionCount] = useState(10);
  const [hasTimer, setHasTimer] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [defaultOptionCount, setDefaultOptionCount] = useState(4);

  // Question management — start empty, add one at a time
  const [questions, setQuestions] = useState<QState[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const isKnowledge = kind === TrainingContentTemplateKind.KNOWLEDGE_TEST;
  const maxQuestions = questionCount || 10;
  const slotsRemaining = maxQuestions - questions.length;
  const canAddQuestion = slotsRemaining > 0 && editingIndex === null;

  const selectedKindLabel = useMemo(() => {
    if (kind === TrainingContentTemplateKind.KNOWLEDGE_TEST) return "Knowledge test";
    if (kind === TrainingContentTemplateKind.BEHAVIORAL_TEST) return "Behavioral (Likert)";
    return kind;
  }, [kind]);

  function handleKindChange(v: string | null) {
    if (!v) return; const k = v as TrainingContentTemplateKind;
    setKind(k);
    setQuestions([]);
    setEditingIndex(null);
  }

  function handleQuestionCountChange(v: string) {
    const n = Number.parseInt(v, 10) || 5;
    const clamped = Math.min(50, Math.max(1, n));
    setQuestionCount(clamped);
    if (questions.length > clamped) {
      setQuestions((qs) => qs.slice(0, clamped));
    }
  }

  function startAddQuestion() {
    setEditingIndex(questions.length);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  function saveQuestion(q: QState) {
    if (!q.text.trim()) {
      toast.error("Enter question text");
      return;
    }
    const idx = editingIndex ?? -1;
    if (idx >= 0 && idx < questions.length) {
      setQuestions((qs) => qs.map((existing, i) => (i === idx ? q : existing)));
    } else {
      setQuestions((qs) => [...qs, q]);
    }
    setEditingIndex(null);
  }

  function editExistingQuestion(idx: number) {
    if (editingIndex !== null) return;
    setEditingIndex(idx);
  }

  function deleteQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
  }

  async function handleAIGenerate() {
    if (!name.trim()) {
      toast.error("Enter a template name first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/generate-training-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: name.trim(),
          description: description.trim(),
          kind,
          count: questionCount,
          isKnowledge,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error((err as { error?: string }).error || "AI generation failed");
      }
      const data = (await res.json()) as { questions: QState[]; source: string };
      const maxSlots = questionCount;
      const generated = data.questions.slice(0, maxSlots).map((q) => ({
        ...q,
        id: `q_ai_${++qidCounter}`,
        options: isKnowledge
          ? q.options.slice(0).map((o, i) => ({
              text: o.text || `Option ${String.fromCharCode(65 + i)}`,
              value: o.value ?? i,
            }))
          : AGREEMENT_LIKERT.map((o) => ({ ...o })),
        correctOptionIndexes: isKnowledge ? q.correctOptionIndexes.filter((c) => c < defaultOptionCount) : [],
        reverseScored: q.reverseScored ?? false,
        competencyKey: q.competencyKey ?? "",
        explanation: q.explanation ?? "",
        points: q.points ?? 1,
        type: isKnowledge
          ? (TrainingContentQuestionType.SINGLE_CHOICE)
          : (q.type === "LIKERT_FREQUENCY" ? TrainingContentQuestionType.LIKERT_FREQUENCY : TrainingContentQuestionType.LIKERT_5_SCALE),
      }));
      setQuestions((prev) => [...prev, ...generated].slice(0, maxSlots));
      toast.success(`AI generated ${generated.length} questions`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  const validationHint = useMemo(() => {
    if (questions.length === 0) return "Add at least one question";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.text.trim()) return `Question ${i + 1}: add prompt text`;
      if (isKnowledge && q.correctOptionIndexes.length < 1) return `Question ${i + 1}: mark a correct answer`;
    }
    return null;
  }, [questions, isKnowledge]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a template name");
      return;
    }
    if (validationHint) {
      toast.error(validationHint);
      return;
    }
    setPending(true);
    try {
      await createTrainingContentTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        kind,
        organizationId: null,
        minQuestions: 1,
        maxQuestions: 50,
        defaultQuestionCount: questionCount,
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

  const EditingForm = editingIndex !== null && (
    <QuestionForm
      initial={
        editingIndex < questions.length
          ? questions[editingIndex]!
          : freshQuestion(kind, defaultOptionCount)
      }
      isKnowledge={isKnowledge}
      onSave={saveQuestion}
      onCancel={cancelEdit}
    />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-[2rem] border border-white/[0.12] bg-[#0F0F11]/95 p-6 md:p-10">
      {/* ── Template Configuration ── */}
      <div className="space-y-4">
        <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/35">
          Template configuration
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-white/80">Template name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Negotiation Knowledge Check"
              className="border-white/10 bg-white/[0.05] text-white/90"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-white/80">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of what this template measures"
              className="border-white/10 bg-white/[0.05] text-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Type</Label>
            <Select value={kind} onValueChange={handleKindChange}>
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue>{selectedKindLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-white/12 bg-[#161618] text-white/95">
                <SelectItem value={TrainingContentTemplateKind.KNOWLEDGE_TEST}>Knowledge test</SelectItem>
                <SelectItem value={TrainingContentTemplateKind.BEHAVIORAL_TEST}>Behavioral (Likert)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Questions in this template</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => handleQuestionCountChange(e.target.value)}
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
                <Label className="text-white/80">Options per question (3–6)</Label>
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
      </div>

      {/* ── Separator ── */}
      <div className="border-t border-white/[0.06]" />

      {/* ── Question Builder ── */}
      <div className="space-y-4">
        {/* Header area */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/35">
            Questions {questions.length > 0 && `(${questions.length} of ${maxQuestions})`}
          </p>
        </div>

        {/* Add question / AI generate area */}
        {editingIndex === null && (
          <div className="space-y-3">
            {/* Large Add Question button */}
            <button
              type="button"
              disabled={!canAddQuestion}
              onClick={startAddQuestion}
              className={cn(
                "group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed p-6 transition-all",
                canAddQuestion
                  ? "border-indigo-500/30 bg-indigo-500/[0.04] hover:border-indigo-500/50 hover:bg-indigo-500/[0.08]"
                  : "cursor-not-allowed border-white/[0.08] bg-white/[0.01] opacity-40",
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex size-12 items-center justify-center rounded-xl transition-all",
                  canAddQuestion ? "bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500/25" : "bg-white/[0.04] text-white/20",
                )}>
                  <Plus className="size-6" />
                </div>
                <div className="text-left">
                  <p className={cn("text-lg font-semibold", canAddQuestion ? "text-white/90" : "text-white/30")}>
                    Add a question
                  </p>
                  <p className={cn("text-sm", canAddQuestion ? "text-white/50" : "text-white/20")}>
                    {canAddQuestion
                      ? `Click to start — ${slotsRemaining} slot${slotsRemaining === 1 ? "" : "s"} remaining`
                      : `${maxQuestions} questions added — maximum reached`}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn("size-5 transition-transform group-hover:translate-x-1", canAddQuestion ? "text-indigo-400" : "text-white/15")} />
            </button>

            {/* AI Generate button */}
            {canAddQuestion && name.trim() && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void handleAIGenerate()}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.04] p-5 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25">
                    {aiLoading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-white/85">
                      {aiLoading ? `Generating ${questionCount} questions with AI…` : `Generate ${questionCount} questions with AI`}
                    </p>
                    <p className="text-sm text-white/45">Populates all questions based on template name and description</p>
                  </div>
                </div>
                <Sparkles className="size-4 text-cyan-400/60" />
              </button>
            )}
          </div>
        )}

        {/* Active question editing form */}
        {EditingForm}

        {/* Question list (collapsed view) */}
        {questions.length > 0 && editingIndex === null && (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12]"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/85">{q.text || "(empty question)"}</p>
                  <p className="text-xs text-white/35">
                    {q.type.replace(/_/g, " ")}
                    {isKnowledge && q.correctOptionIndexes.length > 0 ? ` · ${q.correctOptionIndexes.length === 1 ? "Single choice" : "Multi choice"}` : ""}
                    {!isKnowledge && q.competencyKey ? ` · ${q.competencyKey}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => editExistingQuestion(i)}
                    className="text-white/40 hover:text-white/80"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteQuestion(i)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-6">
        <Button
          type="submit"
          disabled={pending || !!validationHint || editingIndex !== null}
          className={cn(
            "bg-gradient-to-r from-indigo-500 to-violet-600 text-white",
            (validationHint || editingIndex !== null) && "opacity-60",
          )}
        >
          {pending ? "Publishing…" : "Publish template"}
        </Button>
        {validationHint && editingIndex === null && (
          <p className="text-sm text-amber-200/80">{validationHint}</p>
        )}
        {editingIndex !== null && (
          <p className="text-sm text-white/50">Save or cancel the current question before publishing</p>
        )}
      </div>
    </form>
  );
}

/* ── Question Form (inline editing, similar layout to before) ── */

function QuestionForm({
  initial,
  isKnowledge,
  onSave,
  onCancel,
}: {
  initial: QState;
  isKnowledge: boolean;

  onSave: (q: QState) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState<QState>({ ...initial });

  function update(patch: Partial<QState>) {
    setQ((prev) => ({ ...prev, ...patch }));
  }

  function setOptionCount(n: number) {
    const next = Math.min(6, Math.max(3, n));
    const opts = [...q.options].slice(0, next);
    while (opts.length < next) {
      opts.push({ text: `Option ${opts.length + 1}`, value: opts.length });
    }
    let correct = q.correctOptionIndexes.filter((c) => c < next);
    if (correct.length === 0) correct = [0];
    if (q.type === TrainingContentQuestionType.SINGLE_CHOICE) correct = [correct[0] ?? 0];
    update({ options: opts, correctOptionIndexes: correct });
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-indigo-300/70">New question</p>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-white/40 hover:text-white/60">
          Cancel
        </Button>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70">Question</Label>
          <Textarea
            value={q.text}
            onChange={(e) => update({ text: e.target.value })}
            rows={2}
            placeholder="Enter question text..."
            className="border-white/10 bg-white/[0.05] text-white/90"
            autoFocus
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white/70">Question type</Label>
            <Select value={q.type} onValueChange={(v) => {
              const t = v as TrainingContentQuestionType;
              if (isKnowledge) {
                update({ type: t, correctOptionIndexes: t === TrainingContentQuestionType.SINGLE_CHOICE ? [0] : [0] });
              } else {
                if (t === TrainingContentQuestionType.LIKERT_FREQUENCY) {
                  update({ type: t, options: [
                    { text: "Never", value: 1 }, { text: "Rarely", value: 2 },
                    { text: "Sometimes", value: 3 }, { text: "Often", value: 4 }, { text: "Always", value: 5 },
                  ]});
                } else {
                  update({ type: t, options: AGREEMENT_LIKERT.map((o) => ({ ...o })) });
                }
              }
            }}>
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue>{q.type.replace(/_/g, " ")}</SelectValue>
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
              <Input type="number" min={0} value={q.points}
                onChange={(e) => update({ points: Number.parseInt(e.target.value, 10) || 0 })}
                className="border-white/10 bg-white/[0.05] text-white/90" />
            </div>
          )}
        </div>

        {isKnowledge && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-white/70">Options (3–6)</Label>
              <Input type="number" min={3} max={6} value={q.options.length}
                onChange={(e) => setOptionCount(Number.parseInt(e.target.value, 10) || 3)}
                className="w-24 border-white/10 bg-white/[0.05] text-white/90" />
            </div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex flex-wrap items-center gap-2">
                  <Input value={opt.text}
                    onChange={(e) => {
                      const next = [...q.options];
                      next[oi] = { ...next[oi]!, text: e.target.value };
                      update({ options: next });
                    }}
                    className="min-w-[200px] flex-1 border-white/10 bg-white/[0.05] text-white/90" />
                  {q.type === TrainingContentQuestionType.SINGLE_CHOICE ? (
                    <label className="flex items-center gap-2 text-xs text-white/55">
                      <input type="radio" name={`correct-new`} checked={q.correctOptionIndexes[0] === oi}
                        onChange={() => update({ correctOptionIndexes: [oi] })} className="accent-emerald-500" />
                      Correct
                    </label>
                  ) : (
                    <label className="flex items-center gap-2 text-xs text-white/55">
                      <input type="checkbox" checked={q.correctOptionIndexes.includes(oi)}
                        onChange={(e) => {
                          const set = new Set(q.correctOptionIndexes);
                          if (e.target.checked) set.add(oi); else set.delete(oi);
                          update({ correctOptionIndexes: [...set].sort((a, b) => a - b) });
                        }} className="accent-emerald-500" />
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
              <Input value={q.competencyKey} onChange={(e) => update({ competencyKey: e.target.value })}
                className="border-white/10 bg-white/[0.05] text-white/90" placeholder="e.g. leadership" />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={q.reverseScored}
                onChange={(e) => update({ reverseScored: e.target.checked })} className="accent-amber-500" />
              Reverse scored
            </label>
          </div>
        )}

        {isKnowledge && (
          <div className="space-y-2">
            <Label className="text-white/70">Explanation (after answer)</Label>
            <Textarea value={q.explanation} onChange={(e) => update({ explanation: e.target.value })}
              rows={2} className="border-white/10 bg-white/[0.05] text-white/90" />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" onClick={() => onSave(q)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Check className="size-4 mr-1.5" /> Save question
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="text-white/50">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
