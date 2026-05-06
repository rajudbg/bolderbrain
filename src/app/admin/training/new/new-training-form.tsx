"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createTrainingProgram } from "../actions";
import type { TrainingContentTemplateKind } from "@/generated/prisma/enums";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const EMPTY_TEMPLATE = "__training_tpl__" as const;
const EMPTY_CONTENT = "__training_content__" as const;

export function NewTrainingForm({
  templates,
  contentTemplates,
  members,
}: {
  templates: { id: string; key: string; name: string }[];
  contentTemplates: { id: string; name: string; kind: TrainingContentTemplateKind; _count: { questions: number } }[];
  members: { userId: string; user: { id: string; name: string | null; email: string | null } }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentMode, setAssessmentMode] = useState<"behavioral_360" | "content">(
    templates.length > 0 ? "behavioral_360" : "content",
  );
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? EMPTY_TEMPLATE);
  const [contentTemplateId, setContentTemplateId] = useState(contentTemplates[0]?.id ?? EMPTY_CONTENT);
  const [questionPoolCount, setQuestionPoolCount] = useState<number | "">("");
  const [shufflePostQuestions, setShufflePostQuestions] = useState(true);
  const [shufflePostOptions, setShufflePostOptions] = useState(true);
  const [timerOverride, setTimerOverride] = useState<number | "">("");
  const [partialCredit, setPartialCredit] = useState(false);
  const [preOpens, setPreOpens] = useState("");
  const [preCloses, setPreCloses] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [postOpens, setPostOpens] = useState("");
  const [postCloses, setPostCloses] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const templateItems = useMemo(
    () => [
      { value: EMPTY_TEMPLATE, label: "Select template" },
      ...templates.map((t) => ({ value: t.id, label: t.name })),
    ],
    [templates],
  );

  const contentTemplateItems = useMemo(
    () => [
      { value: EMPTY_CONTENT, label: "Select template" },
      ...contentTemplates.map((t) => ({ value: t.id, label: `${t.name} (${t._count.questions} questions)` })),
    ],
    [contentTemplates],
  );

  const selectedTemplateName = useMemo(() => {
    if (templateId === EMPTY_TEMPLATE) return "Template";
    return templates.find((t) => t.id === templateId)?.name ?? "Template";
  }, [templateId, templates]);

  const selectedContentTemplateName = useMemo(() => {
    if (contentTemplateId === EMPTY_CONTENT) return "Template";
    return contentTemplates.find((t) => t.id === contentTemplateId)?.name ?? "Template";
  }, [contentTemplateId, contentTemplates]);

  function toggle(uid: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (assessmentMode === "behavioral_360" && templateId === EMPTY_TEMPLATE) {
      toast.error("Select an assessment template");
      return;
    }
    if (assessmentMode === "content" && contentTemplateId === EMPTY_CONTENT) {
      toast.error("Select a training content template");
      return;
    }
    if (!preOpens || !preCloses || !trainingDate || !postOpens || !postCloses) {
      toast.error("Fill in all schedule fields");
      return;
    }
    setPending(true);
    try {
      const pool =
        assessmentMode === "content" && questionPoolCount !== ""
          ? Number(questionPoolCount)
          : undefined;
      const id = await createTrainingProgram({
        name,
        description: description || undefined,
        assessmentMode,
        templateId: assessmentMode === "behavioral_360" ? templateId : undefined,
        trainingContentTemplateId: assessmentMode === "content" ? contentTemplateId : undefined,
        questionPoolCount: pool,
        shufflePostQuestions: assessmentMode === "content" ? shufflePostQuestions : undefined,
        shufflePostOptions: assessmentMode === "content" ? shufflePostOptions : undefined,
        timerOverrideMinutes:
          assessmentMode === "content" && timerOverride !== "" ? Number(timerOverride) : undefined,
        partialCredit: assessmentMode === "content" ? partialCredit : undefined,
        preOpensAt: new Date(preOpens),
        preClosesAt: new Date(preCloses),
        trainingDate: new Date(trainingDate),
        postOpensAt: new Date(postOpens),
        postClosesAt: new Date(postCloses),
        enrollUserIds: [...selected],
      });
      toast.success("Training program created");
      router.push(`/admin/training/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (templates.length === 0 && contentTemplates.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-[#0F0F11]/90 p-8">
        <p className="text-sm text-white/70">
          Add a behavioral 360 template (Assessment templates) or a flexible training content template (Super Admin → Training
          content) first.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/super-admin/templates" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
            Assessment templates
          </Link>
          <Link
            href="/super-admin/templates/content/new"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Training content builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-8 rounded-[2rem] border border-white/[0.12] bg-[#0F0F11]/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10"
    >
      <div className="space-y-2">
        <Label className="text-white/80">Program name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Executive Communication Mastery"
          className="border-white/10 bg-white/[0.05] text-white/90"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-white/80">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-white/10 bg-white/[0.05] text-white/90"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-white/80">Assessment source</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={templates.length === 0}
            onClick={() => setAssessmentMode("behavioral_360")}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              assessmentMode === "behavioral_360"
                ? "border-amber-400/50 bg-amber-500/15 text-amber-50"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]",
              templates.length === 0 && "cursor-not-allowed opacity-40",
            )}
          >
            Behavioral 360 (self)
          </button>
          <button
            type="button"
            disabled={contentTemplates.length === 0}
            onClick={() => setAssessmentMode("content")}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              assessmentMode === "content"
                ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-50"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]",
              contentTemplates.length === 0 && "cursor-not-allowed opacity-40",
            )}
          >
            Knowledge / behavioral test
          </button>
        </div>
        {contentTemplates.length === 0 ? (
          <p className="text-xs leading-relaxed text-white/45">
            This option needs at least one <span className="text-white/65">published training content template</span> (timed
            knowledge tests or Likert-style behavioral tests). Those are created in{" "}
            <strong className="text-white/75">Super Admin → Training content</strong> and published for all organizations.
            Until a super admin publishes one, only <strong className="text-white/75">Behavioral 360</strong> is available
            here (your org’s 360 templates under Assessment templates).
          </p>
        ) : null}
      </div>

      {assessmentMode === "behavioral_360" && (
        <div className="space-y-2">
          <Label className="text-white/80">360 template (pre & post)</Label>
          <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? EMPTY_TEMPLATE)} items={templateItems}>
            <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
              <SelectValue placeholder="Template">
                {selectedTemplateName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-white/12 bg-[#161618] text-white/95">
              <SelectItem value={EMPTY_TEMPLATE}>Select template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {assessmentMode === "content" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Training content template</Label>
            <Select value={contentTemplateId} onValueChange={(v) => setContentTemplateId(v ?? EMPTY_CONTENT)} items={contentTemplateItems}>
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue placeholder="Template">
                  {selectedContentTemplateName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-white/12 bg-[#161618] text-white/95">
                <SelectItem value={EMPTY_CONTENT}>Select template</SelectItem>
                {contentTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t._count.questions} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Question pool size (optional)</Label>
            <Input
              type="number"
              min={5}
              max={50}
              placeholder="Use template default"
              value={questionPoolCount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") setQuestionPoolCount("");
                else setQuestionPoolCount(Number.parseInt(v, 10) || "");
              }}
              className="border-white/10 bg-white/[0.05] text-white/90"
            />
            <p className="text-xs text-white/40">Leave empty to use each template&apos;s default count (5–50).</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
            <p className="text-sm font-medium text-white/85">Post-assessment &amp; timing</p>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
              <Checkbox
                checked={shufflePostQuestions}
                onCheckedChange={(v) => setShufflePostQuestions(v === true)}
                className="mt-0.5"
              />
              <span>
                Shuffle <strong className="text-white/90">question order</strong> on post-assessment (recommended to reduce
                cheating).
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
              <Checkbox
                checked={shufflePostOptions}
                onCheckedChange={(v) => setShufflePostOptions(v === true)}
                className="mt-0.5"
              />
              <span>
                Shuffle <strong className="text-white/90">answer options</strong> within each question on post (A/B/C/D order
                changes).
              </span>
            </label>
            <div className="space-y-2">
              <Label className="text-white/80">Time limit override (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={300}
                placeholder="Use template default"
                value={timerOverride}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setTimerOverride("");
                  else setTimerOverride(Number.parseInt(v, 10) || "");
                }}
                className="border-white/10 bg-white/[0.05] text-white/90"
              />
              <p className="text-xs text-white/40">
                Optional. Overrides the template&apos;s timer for timed knowledge tests only.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
              <Checkbox checked={partialCredit} onCheckedChange={(v) => setPartialCredit(v === true)} className="mt-0.5" />
              <span>
                <strong className="text-white/90">Partial credit</strong> on multiple-select knowledge questions (penalty for
                wrong selections).
              </span>
            </label>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/80">Pre opens</Label>
          <Input
            type="datetime-local"
            value={preOpens}
            onChange={(e) => setPreOpens(e.target.value)}
            required
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Pre closes</Label>
          <Input
            type="datetime-local"
            value={preCloses}
            onChange={(e) => setPreCloses(e.target.value)}
            required
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-white/80">Training event</Label>
          <Input
            type="datetime-local"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
            required
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Post opens</Label>
          <Input
            type="datetime-local"
            value={postOpens}
            onChange={(e) => setPostOpens(e.target.value)}
            required
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Post closes</Label>
          <Input
            type="datetime-local"
            value={postCloses}
            onChange={(e) => setPostCloses(e.target.value)}
            required
            className="border-white/10 bg-white/[0.05] text-white/90"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-white/80">Enroll participants</Label>
        <div className="max-h-48 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03]">
          {members.map((m) => (
            <label
              key={m.userId}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.04]",
              )}
            >
              <Checkbox checked={selected.has(m.userId)} onCheckedChange={() => toggle(m.userId)} />
              <span>{m.user.name?.trim() || m.user.email || m.userId}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-95"
        >
          {pending ? "Saving…" : "Create program"}
        </Button>
        <Link href="/admin/training" className={cn(buttonVariants({ variant: "ghost" }), "inline-flex")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function NewTrainingHeader() {
  return (
    <div>
      <Link
        href="/admin/training"
        className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/90"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text">
        New training program
      </h1>
      <p className="mt-2 text-sm text-white/55">Schedule pre/post windows and enroll your cohort.</p>
    </div>
  );
}
