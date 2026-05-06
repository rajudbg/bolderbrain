"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { parseQuestionConfig } from "@/lib/question-config";
import { questionTypeLabel } from "@/lib/assessment-question-types";
import type { AssessmentTemplateType } from "@/generated/prisma/enums";
import { QuestionFormDialog, type QuestionDTO } from "./question-form-dialog";
import { deleteQuestion } from "../../actions";
import { useMemo } from "react";

/** Keeps org Select controlled when none chosen (never `value={undefined}`). */
const EMPTY_ORG = "__questions_org_none__" as const;

type OrgOption = { id: string; name: string; slug: string };
type TemplateOption = { id: string; key: string; name: string; type: AssessmentTemplateType };

export function QuestionsClient({
  organizations,
  templateOptions,
  questions,
  selectedOrgId,
  selectedTemplateId,
}: {
  organizations: OrgOption[];
  templateOptions: TemplateOption[];
  questions: QuestionDTO[];
  selectedOrgId: string | null;
  selectedTemplateId: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<QuestionDTO | null>(null);
  const [deleteRow, setDeleteRow] = useState<QuestionDTO | null>(null);
  const [pending, setPending] = useState(false);

  function pushFilters(orgId: string | null | undefined, templateId: string | null | undefined) {
    const params = new URLSearchParams();
    if (orgId) params.set("orgId", orgId);
    if (templateId) params.set("templateId", templateId);
    const q = params.toString();
    router.push(`/super-admin/questions${q ? `?${q}` : ""}`);
  }

  async function handleDelete() {
    if (!deleteRow) return;
    setPending(true);
    try {
      await deleteQuestion(deleteRow.id);
      toast.success("Question deleted");
      setDeleteRow(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  const refresh = () => router.refresh();

  const templatesForForm = templateOptions.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
    type: t.type,
  }));

  const orgSelectItems = [
    { value: EMPTY_ORG, label: "Select organization" },
    ...organizations.map((o) => ({ value: o.id, label: o.name })),
  ];

  const selectedOrgName = useMemo(() => {
    if (!selectedOrgId || selectedOrgId === EMPTY_ORG) return "Select organization";
    return organizations.find((o) => o.id === selectedOrgId)?.name ?? "Select organization";
  }, [selectedOrgId, organizations]);

  const selectedTemplateName = useMemo(() => {
    if (!selectedTemplateId || selectedTemplateId === "all") return "All templates";
    return templateOptions.find((t) => t.id === selectedTemplateId)?.name ?? "All templates";
  }, [selectedTemplateId, templateOptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Questions</h1>
          <p className="text-muted-foreground text-sm">
            Configure items per template. UI adapts for IQ (correct answer), EQ/psychometric (trait), and 360 (Likert).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-medium uppercase">Organization</span>
            <Select
              value={selectedOrgId ?? EMPTY_ORG}
              onValueChange={(id) => pushFilters(id === EMPTY_ORG ? null : id, null)}
              items={orgSelectItems}
            >
              <SelectTrigger className="w-[min(100vw-2rem,240px)]">
                <SelectValue placeholder="Select organization">
                  {selectedOrgName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_ORG}>Select organization</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-medium uppercase">Template</span>
            <Select
              value={selectedTemplateId ?? "all"}
              onValueChange={(v) => pushFilters(selectedOrgId, !v || v === "all" ? null : v)}
              disabled={!selectedOrgId}
            >
              <SelectTrigger className="w-[min(100vw-2rem,260px)]">
                <SelectValue placeholder="All templates">
                  {selectedTemplateName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templateOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={!selectedOrgId || templateOptions.length === 0} onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New question
          </Button>
        </div>
      </div>

      {!selectedOrgId ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          Select an organization to view questions.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead className="hidden lg:table-cell">Prompt</TableHead>
              <TableHead>Template</TableHead>
              <TableHead className="hidden sm:table-cell">Q type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Wt</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                  No questions match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((row) => {
                const preview = parseQuestionConfig(row.config);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{row.key}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[280px] lg:table-cell">
                      <span className="line-clamp-2 text-sm">{preview.prompt || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{row.template.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {row.template.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {questionTypeLabel(row.questionType)}
                    </TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{String(row.weight)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" type="button" onClick={() => setEditRow(row)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="button"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteRow(row)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {selectedOrgId && (
        <QuestionFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          organizationId={selectedOrgId}
          templates={templatesForForm}
          defaultTemplateId={selectedTemplateId ?? templateOptions[0]?.id ?? null}
          onSaved={refresh}
        />
      )}

      {selectedOrgId && (
        <QuestionFormDialog
          mode="edit"
          open={!!editRow}
          onOpenChange={(o) => !o && setEditRow(null)}
          organizationId={selectedOrgId}
          templates={templatesForForm}
          question={editRow ?? undefined}
          onSaved={refresh}
        />
      )}

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes question <strong>{deleteRow?.key}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={pending} onClick={() => void handleDelete()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
