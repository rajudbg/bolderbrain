"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AssessmentQuestionType,
  AssessmentTemplateType,
} from "@/generated/prisma/enums";
import { buildQuestionConfig, parseQuestionConfig } from "@/lib/question-config";
import { EQ_DOMAIN_KEYS } from "@/lib/eq-domains";
import { OCEAN_TRAITS } from "@/lib/ocean-traits";
import { parseForcedChoiceConfig, parseSemanticConfig } from "@/lib/psychometric-scoring";
import { questionTypeLabel, questionTypesForTemplate } from "@/lib/assessment-question-types";
import { createQuestion, updateQuestion } from "../../actions";

export type QuestionDTO = {
  id: string;
  organizationId: string;
  templateId: string;
  key: string;
  questionType: AssessmentQuestionType;
  config: unknown;
  correctOptionId: string | null;
  traitCategory: string | null;
  weight: unknown;
  timeLimitSeconds: number | null;
  reverseScored: boolean;
  sortOrder: number;
  isActive: boolean;
  template: { name: string; key: string; type: AssessmentTemplateType };
};

type TemplateOption = { id: string; key: string; name: string; type: AssessmentTemplateType };

function mapConfigType(
  qt: AssessmentQuestionType,
): "single_choice" | "multi_choice" | "text" | "scale" {
  if (qt === AssessmentQuestionType.MULTI_CHOICE_IQ) return "multi_choice";
  if (qt === AssessmentQuestionType.FREE_TEXT || qt === AssessmentQuestionType.TEXT_SHORT) return "text";
  if (
    qt === AssessmentQuestionType.LIKERT_360 ||
    qt === AssessmentQuestionType.PSYCHOMETRIC_LIKERT ||
    qt === AssessmentQuestionType.EQ_SELF_REPORT
  )
    return "scale";
  if (qt === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL) return "scale";
  return "single_choice";
}

function needsOptions(qt: AssessmentQuestionType): boolean {
  return (
    qt === AssessmentQuestionType.SINGLE_CHOICE_IQ ||
    qt === AssessmentQuestionType.MULTI_CHOICE_IQ ||
    qt === AssessmentQuestionType.NUMERICAL_SEQUENCE ||
    qt === AssessmentQuestionType.VERBAL_ANALOGY ||
    qt === AssessmentQuestionType.LOGICAL_PATTERN ||
    qt === AssessmentQuestionType.SPATIAL_REASONING ||
    qt === AssessmentQuestionType.LIKERT_360 ||
    qt === AssessmentQuestionType.EQ_SCENARIO
  );
}

function needsTraitCategory(templateType: AssessmentTemplateType): boolean {
  return templateType === AssessmentTemplateType.EQ_ASSESSMENT || templateType === AssessmentTemplateType.PSYCHOMETRIC;
}

function needsCompetencyFor360(templateType: AssessmentTemplateType): boolean {
  return (
    templateType === AssessmentTemplateType.BEHAVIORAL_360 ||
    templateType === AssessmentTemplateType.TNA_DIAGNOSTIC
  );
}

function needsCorrectAnswer(templateType: AssessmentTemplateType, qt: AssessmentQuestionType): boolean {
  if (templateType !== AssessmentTemplateType.IQ_COGNITIVE) return false;
  return (
    qt === AssessmentQuestionType.SINGLE_CHOICE_IQ ||
    qt === AssessmentQuestionType.MULTI_CHOICE_IQ ||
    qt === AssessmentQuestionType.NUMERICAL_SEQUENCE ||
    qt === AssessmentQuestionType.VERBAL_ANALOGY ||
    qt === AssessmentQuestionType.LOGICAL_PATTERN ||
    qt === AssessmentQuestionType.SPATIAL_REASONING
  );
}

export function QuestionFormDialog({
  mode,
  open,
  onOpenChange,
  organizationId,
  templates,
  defaultTemplateId,
  question,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  templates: TemplateOption[];
  defaultTemplateId?: string | null;
  question?: QuestionDTO | null;
  onSaved: () => void;
}) {
  const [templateId, setTemplateId] = useState("");
  const [questionType, setQuestionType] = useState<AssessmentQuestionType>(AssessmentQuestionType.LIKERT_360);
  const [key, setKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [richHtml, setRichHtml] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState("");
  const [options, setOptions] = useState<
    { label: string; value: string; eqPoints: string; rationale: string }[]
  >([{ label: "", value: "", eqPoints: "", rationale: "" }]);
  const [reverseScored, setReverseScored] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [traitCategory, setTraitCategory] = useState("");
  const [weight, setWeight] = useState("1");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [configJsonOverride, setConfigJsonOverride] = useState("");
  const [useAdvancedJson, setUseAdvancedJson] = useState(false);
  const [pending, setPending] = useState(false);

  const [psychStatements, setPsychStatements] = useState<
    { id: string; text: string; trait: string }[]
  >([
    { id: "s0", text: "", trait: "Openness" },
    { id: "s1", text: "", trait: "Conscientiousness" },
    { id: "s2", text: "", trait: "Extraversion" },
  ]);
  const [psychItemKind, setPsychItemKind] = useState<"normal" | "consistency" | "social_desirability">(
    "normal",
  );
  const [consistencyPairKey, setConsistencyPairKey] = useState("");
  const [refTrait, setRefTrait] = useState("");
  const [semanticLeft, setSemanticLeft] = useState("");
  const [semanticRight, setSemanticRight] = useState("");
  const [semanticSteps, setSemanticSteps] = useState(5);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const allowedQuestionTypes = useMemo(
    () => (selectedTemplate ? questionTypesForTemplate(selectedTemplate.type) : []),
    [selectedTemplate],
  );

  const isPsychTemplate = selectedTemplate?.type === AssessmentTemplateType.PSYCHOMETRIC;
  const psychNeedsTraitField = Boolean(
    isPsychTemplate &&
      (questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL ||
        questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT),
  );

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && question) {
      setTemplateId(question.templateId);
      setQuestionType(question.questionType);
      setKey(question.key);
      const parsed = parseQuestionConfig(question.config);
      setPrompt(parsed.prompt);
      setRichHtml(parsed.richHtml ?? "");
      setImageUrl(parsed.imageUrl ?? "");
      setTimeLimitSeconds(
        question.timeLimitSeconds != null && question.timeLimitSeconds > 0
          ? String(question.timeLimitSeconds)
          : "",
      );
      setOptions(
        parsed.options.length
          ? parsed.options.map((o) => ({
              label: o.label,
              value: o.value,
              eqPoints: o.eqPoints != null && Number.isFinite(o.eqPoints) ? String(o.eqPoints) : "",
              rationale: o.rationale ?? "",
            }))
          : [{ label: "", value: "", eqPoints: "", rationale: "" }],
      );
      setCorrectOptionId(question.correctOptionId);
      setTraitCategory(question.traitCategory ?? "");
      setReverseScored(question.reverseScored ?? false);
      setWeight(String(question.weight ?? "1"));
      setSortOrder(question.sortOrder);
      setIsActive(question.isActive);
      setConfigJsonOverride(
        question.config && typeof question.config === "object" ? JSON.stringify(question.config, null, 2) : "",
      );
      setUseAdvancedJson(false);
      if (question.questionType === AssessmentQuestionType.FORCED_CHOICE_IPSATIVE) {
        const fc = parseForcedChoiceConfig(question.config);
        const stmts = fc.statements.slice(0, 3);
        while (stmts.length < 3) {
          stmts.push({ id: `s${stmts.length}`, text: "", trait: "Openness" });
        }
        setPsychStatements(
          stmts.map((s, i) => ({
            id: s.id || `s${i}`,
            text: s.text,
            trait: (OCEAN_TRAITS as readonly string[]).includes(s.trait) ? s.trait : "Openness",
          })),
        );
        setPsychItemKind(fc.psychItemKind);
        setConsistencyPairKey(fc.consistencyPairKey ?? "");
        setRefTrait(fc.refTrait ?? "");
      }
      if (question.questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL) {
        const sc = parseSemanticConfig(question.config);
        setSemanticLeft(sc.leftLabel);
        setSemanticRight(sc.rightLabel);
        setSemanticSteps(sc.steps);
      }
    } else {
      setTemplateId(defaultTemplateId ?? templates[0]?.id ?? "");
      setQuestionType(AssessmentQuestionType.LIKERT_360);
      setKey("");
      setPrompt("");
      setRichHtml("");
      setImageUrl("");
      setTimeLimitSeconds("");
      setOptions([{ label: "", value: "", eqPoints: "", rationale: "" }]);
      setCorrectOptionId(null);
      setTraitCategory("");
      setReverseScored(false);
      setWeight("1");
      setSortOrder(0);
      setIsActive(true);
      setConfigJsonOverride("");
      setUseAdvancedJson(false);
      setPsychStatements([
        { id: "s0", text: "", trait: "Openness" },
        { id: "s1", text: "", trait: "Conscientiousness" },
        { id: "s2", text: "", trait: "Extraversion" },
      ]);
      setPsychItemKind("normal");
      setConsistencyPairKey("");
      setRefTrait("");
      setSemanticLeft("");
      setSemanticRight("");
      setSemanticSteps(5);
    }
  }, [open, mode, question, defaultTemplateId, templates]);

  useEffect(() => {
    if (!selectedTemplate || allowedQuestionTypes.length === 0) return;
    if (mode === "edit" && question) return;
    if (!allowedQuestionTypes.includes(questionType)) {
      setQuestionType(allowedQuestionTypes[0]!);
    }
  }, [selectedTemplate, allowedQuestionTypes, questionType, mode, question]);

  function addOption() {
    setOptions((o) => [...o, { label: "", value: "", eqPoints: "", rationale: "" }]);
  }

  function removeOption(i: number) {
    setOptions((o) => o.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, field: "label" | "value" | "eqPoints" | "rationale", value: string) {
    setOptions((o) => o.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) {
      toast.error("Select an assessment template");
      return;
    }
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) {
      toast.error("Invalid template");
      return;
    }

    setPending(true);
    try {
      let configJson: string | undefined;
      if (useAdvancedJson) {
        const raw = configJsonOverride.trim();
        if (raw) {
          try {
            JSON.parse(raw);
            configJson = raw;
          } catch {
            toast.error("Config JSON is invalid");
            setPending(false);
            return;
          }
        }
      } else {
        const mappedOptions = options
          .filter((o) => o.label.trim())
          .map((o) => {
            const row: {
              label: string;
              value: string;
              eqPoints?: number;
              rationale?: string;
            } = {
              label: o.label.trim(),
              value: (o.value || o.label).trim(),
            };
            const pts = o.eqPoints.trim();
            if (pts !== "") {
              const n = Number.parseFloat(pts);
              if (!Number.isNaN(n)) row.eqPoints = n;
            }
            if (o.rationale.trim()) row.rationale = o.rationale.trim();
            return row;
          });

        if (tmpl.type === AssessmentTemplateType.PSYCHOMETRIC && questionType === AssessmentQuestionType.FORCED_CHOICE_IPSATIVE) {
          const statements = psychStatements.map((s, i) => ({
            id: s.id.trim() || `s${i}`,
            text: s.text.trim(),
            trait: s.trait,
          }));
          if (statements.some((s) => !s.text)) {
            toast.error("Enter text for all three statements");
            setPending(false);
            return;
          }
          const ids = statements.map((s) => s.id);
          if (new Set(ids).size !== ids.length) {
            toast.error("Statement IDs must be unique");
            setPending(false);
            return;
          }
          configJson = JSON.stringify({
            prompt: prompt.trim(),
            statements,
            psychItemKind,
            consistencyPairKey:
              psychItemKind === "consistency" && consistencyPairKey.trim()
                ? consistencyPairKey.trim()
                : undefined,
            refTrait: psychItemKind === "consistency" && refTrait.trim() ? refTrait.trim() : undefined,
            assessmentQuestionType: AssessmentQuestionType.FORCED_CHOICE_IPSATIVE,
          });
        } else if (tmpl.type === AssessmentTemplateType.PSYCHOMETRIC && questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL) {
          if (!semanticLeft.trim() || !semanticRight.trim()) {
            toast.error("Left and right labels are required");
            setPending(false);
            return;
          }
          configJson = JSON.stringify({
            prompt: prompt.trim(),
            leftLabel: semanticLeft.trim(),
            rightLabel: semanticRight.trim(),
            steps: Math.max(3, Math.min(9, Math.floor(semanticSteps))),
            assessmentQuestionType: AssessmentQuestionType.SEMANTIC_DIFFERENTIAL,
          });
        } else if (tmpl.type === AssessmentTemplateType.PSYCHOMETRIC && questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT) {
          const cfg = buildQuestionConfig({
            prompt,
            richHtml: richHtml.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            type: "scale",
            options: [],
          });
          configJson = JSON.stringify({
            ...cfg,
            assessmentQuestionType: AssessmentQuestionType.PSYCHOMETRIC_LIKERT,
            scaleMin: 1,
            scaleMax: 5,
          });
        } else {
          let cfg;
          if (questionType === AssessmentQuestionType.EQ_SELF_REPORT) {
            cfg = buildQuestionConfig({
              prompt,
              richHtml: richHtml.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              type: "scale",
              options: [],
            });
          } else {
            cfg = buildQuestionConfig({
              prompt,
              richHtml: richHtml.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              type: mapConfigType(questionType),
              options: mappedOptions,
            });
          }
          configJson = JSON.stringify({
            ...cfg,
            assessmentQuestionType: questionType,
            scaleMin: questionType === AssessmentQuestionType.EQ_SELF_REPORT ? 1 : undefined,
            scaleMax: questionType === AssessmentQuestionType.EQ_SELF_REPORT ? 7 : undefined,
          });
        }
      }

      const wt = Number.parseFloat(weight);
      if (Number.isNaN(wt) || wt < 0) {
        toast.error("Weight must be a non-negative number");
        setPending(false);
        return;
      }

      let trait: string | null = null;
      if (needsCompetencyFor360(tmpl.type)) {
        trait = traitCategory.trim() || null;
      } else if (tmpl.type === AssessmentTemplateType.PSYCHOMETRIC) {
        trait = psychNeedsTraitField ? traitCategory.trim() || null : null;
      } else if (needsTraitCategory(tmpl.type)) {
        trait = traitCategory.trim() || null;
      }
      const correct =
        needsCorrectAnswer(tmpl.type, questionType) ? correctOptionId?.trim() || null : null;

      const tls = timeLimitSeconds.trim();
      const timeLimitParsed =
        tls === "" ? null : Number.parseInt(tls, 10);
      if (timeLimitParsed !== null && (Number.isNaN(timeLimitParsed) || timeLimitParsed < 10)) {
        toast.error("Time limit per question must be at least 10 seconds or left blank");
        setPending(false);
        return;
      }

      if (mode === "create") {
        await createQuestion({
          organizationId,
          templateId,
          key,
          questionType,
          configJson,
          correctOptionId: correct,
          traitCategory: trait,
          weight: wt,
          timeLimitSeconds: timeLimitParsed,
          reverseScored:
            questionType === AssessmentQuestionType.EQ_SELF_REPORT
              ? reverseScored
              : isPsychTemplate &&
                  (questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL ||
                    questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT)
                ? reverseScored
                : false,
          sortOrder,
          isActive,
        });
        toast.success("Question created");
      } else if (question) {
        await updateQuestion({
          id: question.id,
          organizationId,
          templateId,
          key,
          questionType,
          configJson,
          correctOptionId: correct,
          traitCategory: trait,
          weight: wt,
          timeLimitSeconds: timeLimitParsed,
          reverseScored:
            questionType === AssessmentQuestionType.EQ_SELF_REPORT
              ? reverseScored
              : isPsychTemplate &&
                  (questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL ||
                    questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT)
                ? reverseScored
                : false,
          sortOrder,
          isActive,
        });
        toast.success("Question updated");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  const builtOptionsForCorrect = useMemo(() => {
    if (!needsOptions(questionType)) return [];
    const mappedOptions = options
      .filter((o) => o.label.trim())
      .map((o) => {
        const row: {
          label: string;
          value: string;
          eqPoints?: number;
          rationale?: string;
        } = {
          label: o.label.trim(),
          value: (o.value || o.label).trim(),
        };
        const pts = o.eqPoints.trim();
        if (pts !== "") {
          const n = Number.parseFloat(pts);
          if (!Number.isNaN(n)) row.eqPoints = n;
        }
        if (o.rationale.trim()) row.rationale = o.rationale.trim();
        return row;
      });
    const cfg = buildQuestionConfig({
      prompt,
      richHtml: richHtml.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      type: mapConfigType(questionType),
      options: mappedOptions,
    });
    const opts = (cfg.options ?? []) as { id: string; label: string; value?: string }[];
    return opts;
  }, [options, prompt, questionType, imageUrl, richHtml]);

  const showTrait = Boolean(
    selectedTemplate &&
      (selectedTemplate.type === AssessmentTemplateType.EQ_ASSESSMENT ||
        psychNeedsTraitField ||
        needsCompetencyFor360(selectedTemplate.type)),
  );
  const showCorrect = selectedTemplate ? needsCorrectAnswer(selectedTemplate.type, questionType) : false;
  const showStructuredOptions = needsOptions(questionType) && !useAdvancedJson;
  const isEqTemplate = selectedTemplate?.type === AssessmentTemplateType.EQ_ASSESSMENT;
  const showEqScenarioExtras = Boolean(isEqTemplate && questionType === AssessmentQuestionType.EQ_SCENARIO);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New question" : "Edit question"}</DialogTitle>
            <DialogDescription>
              Fields adapt to the template type (IQ: correct answer; EQ/psychometric: trait category).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Assessment template</Label>
              <Select value={templateId || undefined} onValueChange={(v) => setTemplateId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.type.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question type</Label>
              <Select
                value={questionType}
                onValueChange={(v) => setQuestionType((v ?? questionType) as AssessmentQuestionType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedQuestionTypes.map((qt) => (
                    <SelectItem key={qt} value={qt}>
                      {questionTypeLabel(qt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-key">Key</Label>
                <Input id="q-key" value={key} onChange={(e) => setKey(e.target.value)} required placeholder="q1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-sort">Sort order</Label>
                <Input
                  id="q-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number.parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-weight">Weight / points</Label>
              <Input id="q-weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="1" />
            </div>

            {showTrait && (
              <div className="space-y-2">
                <Label htmlFor="q-trait">
                  {selectedTemplate && needsCompetencyFor360(selectedTemplate.type)
                    ? "Competency (group)"
                    : isPsychTemplate
                      ? "Big Five trait (this item)"
                      : "EQ domain (Goleman)"}
                </Label>
                {isEqTemplate ? (
                  <Select value={traitCategory || undefined} onValueChange={(v) => setTraitCategory(v ?? "")}>
                    <SelectTrigger id="q-trait" className="w-full">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQ_DOMAIN_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : isPsychTemplate && psychNeedsTraitField ? (
                  <Select value={traitCategory || undefined} onValueChange={(v) => setTraitCategory(v ?? "")}>
                    <SelectTrigger id="q-trait" className="w-full">
                      <SelectValue placeholder="Select trait" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCEAN_TRAITS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="q-trait"
                    value={traitCategory}
                    onChange={(e) => setTraitCategory(e.target.value)}
                    placeholder={
                      selectedTemplate && needsCompetencyFor360(selectedTemplate.type)
                        ? "Communication, Leadership, …"
                        : "Trait key"
                    }
                  />
                )}
              </div>
            )}

            {isEqTemplate && questionType === AssessmentQuestionType.EQ_SELF_REPORT && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="q-rev"
                  checked={reverseScored}
                  onCheckedChange={(v) => setReverseScored(v === true)}
                />
                <Label htmlFor="q-rev" className="font-normal">
                  Reverse scored (disagree = higher EQ)
                </Label>
              </div>
            )}

            {isPsychTemplate &&
              (questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL ||
                questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT) && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="q-rev-psych"
                    checked={reverseScored}
                    onCheckedChange={(v) => setReverseScored(v === true)}
                  />
                  <Label htmlFor="q-rev-psych" className="font-normal">
                    Reverse scored (flip scale direction for this trait)
                  </Label>
                </div>
              )}

            {showCorrect && builtOptionsForCorrect.length > 0 && (
              <div className="space-y-2">
                <Label>Correct answer (IQ)</Label>
                <Select
                  value={correctOptionId ?? undefined}
                  onValueChange={(v) => setCorrectOptionId(v ?? null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    {builtOptionsForCorrect.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="q-adv" checked={useAdvancedJson} onCheckedChange={(v) => setUseAdvancedJson(v === true)} />
              <Label htmlFor="q-adv" className="font-normal">
                Advanced: edit raw JSON config
              </Label>
            </div>

            {useAdvancedJson ? (
              <div className="space-y-2">
                <Label htmlFor="q-json">Config JSON</Label>
                <Textarea
                  id="q-json"
                  value={configJsonOverride}
                  onChange={(e) => setConfigJsonOverride(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="q-prompt">Prompt</Label>
                  <Textarea id="q-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
                </div>
                {isPsychTemplate && questionType === AssessmentQuestionType.FORCED_CHOICE_IPSATIVE && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs">
                      Enter three statements. Respondents choose which is most and least like them (ipsative triad).
                    </p>
                    {psychStatements.map((row, i) => (
                      <div key={i} className="border-border space-y-2 rounded-lg border p-2">
                        <div className="grid gap-2 sm:grid-cols-[1fr_minmax(140px,1fr)]">
                          <Input
                            placeholder={`Statement ${i + 1}`}
                            value={row.text}
                            onChange={(e) =>
                              setPsychStatements((s) =>
                                s.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)),
                              )
                            }
                          />
                          <Select
                            value={row.trait}
                            onValueChange={(v) =>
                              setPsychStatements((s) =>
                                s.map((r, j) => (j === i ? { ...r, trait: v ?? "Openness" } : r)),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OCEAN_TRAITS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder="Statement id (optional, e.g. s0)"
                          value={row.id}
                          onChange={(e) =>
                            setPsychStatements((s) =>
                              s.map((r, j) => (j === i ? { ...r, id: e.target.value } : r)),
                            )
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>Item kind</Label>
                      <Select
                        value={psychItemKind}
                        onValueChange={(v) =>
                          setPsychItemKind(v as "normal" | "consistency" | "social_desirability")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="consistency">Consistency check (paired)</SelectItem>
                          <SelectItem value="social_desirability">Social desirability</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {psychItemKind === "consistency" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="q-pair-key">Pair key</Label>
                          <Input
                            id="q-pair-key"
                            value={consistencyPairKey}
                            onChange={(e) => setConsistencyPairKey(e.target.value)}
                            placeholder="e.g. pair_open_1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reference trait (for scoring check)</Label>
                          <Select value={refTrait || undefined} onValueChange={(v) => setRefTrait(v ?? "")}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Trait" />
                            </SelectTrigger>
                            <SelectContent>
                              {OCEAN_TRAITS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                {isPsychTemplate && questionType === AssessmentQuestionType.SEMANTIC_DIFFERENTIAL && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="q-sem-l">Left label</Label>
                      <Input
                        id="q-sem-l"
                        value={semanticLeft}
                        onChange={(e) => setSemanticLeft(e.target.value)}
                        placeholder="e.g. Energetic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-sem-r">Right label</Label>
                      <Input
                        id="q-sem-r"
                        value={semanticRight}
                        onChange={(e) => setSemanticRight(e.target.value)}
                        placeholder="e.g. Calm"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="q-sem-steps">Scale steps (odd, 3–9)</Label>
                      <Input
                        id="q-sem-steps"
                        type="number"
                        min={3}
                        max={9}
                        step={2}
                        value={semanticSteps}
                        onChange={(e) => setSemanticSteps(Number.parseInt(e.target.value, 10) || 5)}
                      />
                    </div>
                  </div>
                )}
                {isPsychTemplate && questionType === AssessmentQuestionType.PSYCHOMETRIC_LIKERT && (
                  <p className="text-muted-foreground text-xs">
                    Self-report 1–5; map the trait above. Shown to respondents as a simple scale.
                  </p>
                )}
                {isEqTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="q-eq-rich">Rich HTML (optional)</Label>
                    <Textarea
                      id="q-eq-rich"
                      value={richHtml}
                      onChange={(e) => setRichHtml(e.target.value)}
                      rows={3}
                      placeholder="Scenario formatting…"
                      className="font-mono text-xs"
                    />
                  </div>
                )}
                {selectedTemplate?.type === AssessmentTemplateType.IQ_COGNITIVE && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="q-rich">Rich HTML stem (optional)</Label>
                      <Textarea
                        id="q-rich"
                        value={richHtml}
                        onChange={(e) => setRichHtml(e.target.value)}
                        rows={3}
                        placeholder="<p>…</p>"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-img">Image URL (optional)</Label>
                      <Input
                        id="q-img"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-time">Time limit (seconds, optional)</Label>
                      <Input
                        id="q-time"
                        type="number"
                        min={10}
                        value={timeLimitSeconds}
                        onChange={(e) => setTimeLimitSeconds(e.target.value)}
                        placeholder="e.g. 90 (default from template if empty)"
                      />
                    </div>
                  </>
                )}
                {showStructuredOptions && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{showEqScenarioExtras ? "Response options (EQ points 0–100)" : "Options"}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        Add option
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {options.map((row, i) => (
                        <div key={i} className="border-border space-y-2 rounded-lg border p-2">
                          <div className="flex flex-wrap gap-2">
                            <Input
                              placeholder="Label"
                              value={row.label}
                              onChange={(e) => updateOption(i, "label", e.target.value)}
                              className="min-w-[120px] flex-1"
                            />
                            <Input
                              placeholder="Value"
                              value={row.value}
                              onChange={(e) => updateOption(i, "value", e.target.value)}
                              className="max-w-[100px]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeOption(i)}
                              aria-label="Remove option"
                            >
                              —
                            </Button>
                          </div>
                          {showEqScenarioExtras ? (
                            <>
                              <Input
                                placeholder="EQ points (0–100)"
                                value={row.eqPoints}
                                onChange={(e) => updateOption(i, "eqPoints", e.target.value)}
                                className="text-sm"
                              />
                              <Textarea
                                placeholder="Rationale (shown after selection)"
                                value={row.rationale}
                                onChange={(e) => updateOption(i, "rationale", e.target.value)}
                                rows={2}
                                className="text-xs"
                              />
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="q-active" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              <Label htmlFor="q-active" className="font-normal">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
