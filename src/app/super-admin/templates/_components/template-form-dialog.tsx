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
  AssessmentTemplateType,
  ScoringStrategy,
} from "@/generated/prisma/enums";
import { defaultScoringStrategyForTemplateType } from "@/lib/assessment-template-defaults";
import { createAssessmentTemplate, updateAssessmentTemplate } from "../../actions";

export type AssessmentTemplateDTO = {
  id: string;
  organizationId: string;
  type: AssessmentTemplateType;
  scoringStrategy: ScoringStrategy;
  key: string;
  name: string;
  description: string | null;
  config: unknown;
  sortOrder: number;
  isActive: boolean;
};

function stringifyConfig(config: unknown): string {
  if (config == null) return "";
  if (typeof config === "object" && config !== null && Object.keys(config as object).length === 0) return "";
  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return "";
  }
}

type OrgOption = { id: string; name: string; slug: string };

const TEMPLATE_TYPES: AssessmentTemplateType[] = [
  AssessmentTemplateType.BEHAVIORAL_360,
  AssessmentTemplateType.TNA_DIAGNOSTIC,
  AssessmentTemplateType.IQ_COGNITIVE,
  AssessmentTemplateType.EQ_ASSESSMENT,
  AssessmentTemplateType.PSYCHOMETRIC,
];

const SCORING: ScoringStrategy[] = [
  ScoringStrategy.MULTI_SOURCE,
  ScoringStrategy.SUM_CORRECT,
  ScoringStrategy.TRAIT_AGGREGATE,
];

/** Placeholder value so org Select stays controlled when empty. */
const EMPTY_ORG = "__template_org_none__" as const;

export function TemplateFormDialog({
  mode,
  open,
  onOpenChange,
  organizations,
  defaultOrganizationId,
  template,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: OrgOption[];
  defaultOrganizationId?: string | null;
  template?: AssessmentTemplateDTO | null;
  onSaved: () => void;
}) {
  const [organizationId, setOrganizationId] = useState("");
  const [type, setType] = useState<AssessmentTemplateType>(AssessmentTemplateType.BEHAVIORAL_360);
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategy>(ScoringStrategy.MULTI_SOURCE);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && template) {
      setOrganizationId(template.organizationId);
      setType(template.type);
      setScoringStrategy(template.scoringStrategy);
      setKey(template.key);
      setName(template.name);
      setDescription(template.description ?? "");
      setConfigJson(stringifyConfig(template.config));
      setSortOrder(template.sortOrder);
      setIsActive(template.isActive);
    } else {
      setOrganizationId(defaultOrganizationId ?? "");
      setType(AssessmentTemplateType.BEHAVIORAL_360);
      setScoringStrategy(defaultScoringStrategyForTemplateType(AssessmentTemplateType.BEHAVIORAL_360));
      setKey("");
      setName("");
      setDescription("");
      setConfigJson("");
      setSortOrder(0);
      setIsActive(true);
    }
  }, [open, mode, template, defaultOrganizationId]);

  useEffect(() => {
    if (mode === "create") {
      setScoringStrategy(defaultScoringStrategyForTemplateType(type));
    }
  }, [type, mode]);

  const orgSelectItems = useMemo(
    () => [
      { value: EMPTY_ORG, label: "Select organization" },
      ...organizations.map((o) => ({ value: o.id, label: `${o.name} (${o.slug})` })),
    ],
    [organizations],
  );

  const selectedOrgName = useMemo(() => {
    if (!organizationId || organizationId === EMPTY_ORG) return "Select organization";
    const org = organizations.find((o) => o.id === organizationId);
    return org ? `${org.name} (${org.slug})` : "Select organization";
  }, [organizationId, organizations]);

  const selectedTypeLabel = useMemo(() => {
    return type.replace(/_/g, " ");
  }, [type]);

  const selectedScoringLabel = useMemo(() => {
    return scoringStrategy.replace(/_/g, " ");
  }, [scoringStrategy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create" && !organizationId) {
      toast.error("Select an organization");
      return;
    }
    setPending(true);
    try {
      if (mode === "create") {
        await createAssessmentTemplate({
          organizationId,
          type,
          scoringStrategy,
          key,
          name,
          description: description || undefined,
          configJson: configJson || undefined,
          sortOrder,
          isActive,
        });
        toast.success("Assessment template created");
      } else if (template) {
        await updateAssessmentTemplate({
          id: template.id,
          type,
          scoringStrategy,
          key,
          name,
          description: description || undefined,
          configJson: configJson || undefined,
          sortOrder,
          isActive,
        });
        toast.success("Assessment template updated");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New assessment template" : "Edit assessment template"}</DialogTitle>
            <DialogDescription>
              Templates define assessment type, scoring strategy, and shared configuration. Questions belong to a template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {mode === "create" ? (
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={organizationId || EMPTY_ORG}
                  onValueChange={(v) => setOrganizationId(v === EMPTY_ORG ? "" : (v ?? ""))}
                  items={orgSelectItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select organization">
                      {selectedOrgName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_ORG}>Select organization</SelectItem>
                    {organizations.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} ({o.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              template && (
                <p className="text-muted-foreground text-sm">
                  Organization:{" "}
                  <span className="text-foreground font-medium">
                    {organizations.find((o) => o.id === template.organizationId)?.name ?? template.organizationId}
                  </span>
                </p>
              )
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assessment type</Label>
                <Select value={type} onValueChange={(v) => setType((v ?? type) as AssessmentTemplateType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedTypeLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scoring strategy</Label>
                <Select
                  value={scoringStrategy}
                  onValueChange={(v) => setScoringStrategy((v ?? scoringStrategy) as ScoringStrategy)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedScoringLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SCORING.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-key">Key</Label>
                <Input id="t-key" value={key} onChange={(e) => setKey(e.target.value)} required placeholder="360-leadership" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-sort">Sort order</Label>
                <Input
                  id="t-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number.parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Leadership 360" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-config">Config (JSON)</Label>
              <Textarea
                id="t-config"
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                placeholder='{ "scale": { "min": 1, "max": 5 } }'
                rows={5}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="t-active" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              <Label htmlFor="t-active" className="font-normal">
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
