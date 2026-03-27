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
import { TemplateFormDialog, type AssessmentTemplateDTO } from "./template-form-dialog";
import { deleteAssessmentTemplate } from "../../actions";

/** Keeps org Select controlled when none chosen (never `value={undefined}`). */
const EMPTY_ORG = "__templates_org_none__" as const;

type OrgOption = { id: string; name: string; slug: string };

export function TemplatesClient({
  organizations,
  templates,
  selectedOrgId,
}: {
  organizations: OrgOption[];
  templates: (AssessmentTemplateDTO & { organization: { name: string; slug: string } })[];
  selectedOrgId: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<
    (AssessmentTemplateDTO & { organization: { name: string; slug: string } }) | null
  >(null);
  const [deleteRow, setDeleteRow] = useState<AssessmentTemplateDTO | null>(null);
  const [pending, setPending] = useState(false);

  function onOrgChange(id: string | null) {
    const q = id ? `?orgId=${encodeURIComponent(id)}` : "";
    router.push(`/super-admin/templates${q}`);
  }

  async function handleDelete() {
    if (!deleteRow) return;
    setPending(true);
    try {
      await deleteAssessmentTemplate(deleteRow.id);
      toast.success("Assessment template deleted");
      setDeleteRow(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  const refresh = () => router.refresh();

  const orgSelectItems = [
    { value: EMPTY_ORG, label: "Select organization" },
    ...organizations.map((o) => ({ value: o.id, label: o.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-3xl">
            Assessment templates
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Define 360, IQ, EQ, and psychometric assessments. Scoring strategy drives backend scoring engines.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <span className="text-caption-cerebral text-[10px] text-white/35">Organization</span>
            <Select
              value={selectedOrgId ?? EMPTY_ORG}
              onValueChange={(v) => onOrgChange(v === EMPTY_ORG ? null : v)}
              items={orgSelectItems}
            >
              <SelectTrigger className="w-[min(100vw-2rem,280px)] border-white/10 bg-white/[0.04] text-white/90">
                <SelectValue placeholder="Select organization" />
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
          <Button type="button" disabled={!selectedOrgId} onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New template
          </Button>
        </div>
      </div>

      {!selectedOrgId ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/50">
          Select an organization to view and manage assessment templates.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Scoring</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sort</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-white/45">
                  No templates for this organization yet.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <code className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-white/70">
                      {row.key}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium text-white/90">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.type.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-white/50 md:table-cell">
                    {row.scoringStrategy.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {row.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.sortOrder}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
        </div>
      )}

      <TemplateFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizations={organizations}
        defaultOrganizationId={selectedOrgId}
        onSaved={refresh}
      />

      <TemplateFormDialog
        mode="edit"
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        organizations={organizations}
        template={editRow ?? undefined}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assessment template?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteRow?.name}</strong> and all questions under it. This cannot be undone.
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
