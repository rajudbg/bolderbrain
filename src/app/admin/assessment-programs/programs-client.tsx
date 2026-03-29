"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import { OrgAssessmentAssignmentKind, OrgAssessmentAssignmentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  cancelOrgAssignment,
  createOrgAssessmentAssignments,
  listOrgAssignmentsForAdmin,
  listTemplatesForAssignmentKind,
  remindOrgAssignment,
} from "../assignment-actions";
import { listOrgMembersForTraining } from "../training/actions";

type Row = {
  id: string;
  kind: OrgAssessmentAssignmentKind;
  status: OrgAssessmentAssignmentStatus;
  dueAt: string | null;
  lastReminderAt: string | null;
  createdAt: string;
  assignedUser: { id: string; name: string | null; email: string | null };
  template: { id: string; name: string; type: string };
};

const KIND_OPTIONS: { value: OrgAssessmentAssignmentKind; label: string }[] = [
  { value: OrgAssessmentAssignmentKind.IQ_COGNITIVE, label: "Cognitive (IQ)" },
  { value: OrgAssessmentAssignmentKind.EQ_ASSESSMENT, label: "EQ" },
  { value: OrgAssessmentAssignmentKind.PSYCHOMETRIC, label: "Personality" },
];

function statusBadge(status: OrgAssessmentAssignmentStatus) {
  switch (status) {
    case OrgAssessmentAssignmentStatus.COMPLETED:
      return <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200">Completed</Badge>;
    case OrgAssessmentAssignmentStatus.IN_PROGRESS:
      return <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-200">In progress</Badge>;
    case OrgAssessmentAssignmentStatus.CANCELLED:
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function mapRows(next: Awaited<ReturnType<typeof listOrgAssignmentsForAdmin>>): Row[] {
  return next.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    dueAt: r.dueAt?.toISOString() ?? null,
    lastReminderAt: r.lastReminderAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    assignedUser: r.assignedUser,
    template: r.template,
  }));
}

export function AssignmentProgramsClient({
  orgId: _orgId,
  initialRows,
}: {
  orgId: string;
  initialRows: Row[];
}) {
  void _orgId;
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [kind, setKind] = useState<OrgAssessmentAssignmentKind>(OrgAssessmentAssignmentKind.EQ_ASSESSMENT);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [due, setDue] = useState<string>("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTemplates = useCallback(async (k: OrgAssessmentAssignmentKind) => {
    setLoadingTemplates(true);
    try {
      const t = await listTemplatesForAssignmentKind(k);
      setTemplates(t);
      setTemplateId((prev) => (t.some((x) => x.id === prev) ? prev : t[0]?.id ?? ""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates(kind);
  }, [kind, loadTemplates]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      try {
        const m = await listOrgMembersForTraining();
        if (!cancelled) {
          setMembers(m.map((x) => ({ id: x.user.id, name: x.user.name, email: x.user.email })));
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load people");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshRows() {
    const next = await listOrgAssignmentsForAdmin();
    setRows(mapRows(next));
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-white/70">Assessment type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as OrgAssessmentAssignmentKind)}>
            <SelectTrigger className="border-white/10 bg-white/[0.04] text-white/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-white/70">Template</Label>
          <Select
            value={templateId}
            onValueChange={(v) => setTemplateId(v ?? "")}
            disabled={loadingTemplates}
          >
            <SelectTrigger className="border-white/10 bg-white/[0.04] text-white/90">
              <SelectValue placeholder={loadingTemplates ? "Loading…" : "Select template"} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3 md:col-span-2">
          <Label className="text-white/70">Assign to (select one or more)</Label>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-3">
            {loadingMembers ? (
              <p className="text-sm text-white/45">Loading people…</p>
            ) : (
              members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                  <Checkbox
                    checked={memberIds.includes(m.id)}
                    onCheckedChange={(c) => {
                      if (c === true) setMemberIds((s) => [...s, m.id]);
                      else setMemberIds((s) => s.filter((id) => id !== m.id));
                    }}
                  />
                  <span>{m.name || m.email}</span>
                  {m.email ? <span className="text-white/40">({m.email})</span> : null}
                </label>
              ))
            )}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-white/70">Due date (optional)</Label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90"
          />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(c === true)} />
            Send email invite (Resend + EMAIL_FROM)
          </label>
        </div>
        <div className="md:col-span-2">
          <Button
            type="button"
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
            disabled={submitting || !templateId || memberIds.length === 0}
            onClick={async () => {
              setSubmitting(true);
              try {
                const dueAt = due ? new Date(`${due}T23:59:59`) : null;
                await createOrgAssessmentAssignments({
                  kind,
                  templateId,
                  assignedUserIds: memberIds,
                  dueAt,
                  sendEmail,
                });
                toast.success("Assignments created");
                setMemberIds([]);
                await refreshRows();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create assignments
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/45">
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Template</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Last reminder</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-white/45">
                  No assignments yet — create one above.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.06] text-white/85">
                  <td className="px-3 py-2">
                    <div>{r.assignedUser.name || "—"}</div>
                    <div className="text-xs text-white/40">{r.assignedUser.email}</div>
                  </td>
                  <td className="px-3 py-2">{r.kind.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{r.template.name}</td>
                  <td className="px-3 py-2">{statusBadge(r.status)}</td>
                  <td className="px-3 py-2 tabular-nums text-white/60">
                    {r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-white/50">
                    {r.lastReminderAt ? new Date(r.lastReminderAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/15"
                        disabled={
                          busyId === r.id ||
                          r.status === OrgAssessmentAssignmentStatus.COMPLETED ||
                          r.status === OrgAssessmentAssignmentStatus.CANCELLED
                        }
                        onClick={async () => {
                          setBusyId(r.id);
                          try {
                            const res = await remindOrgAssignment(r.id);
                            if (res.ok) toast.success(res.message);
                            else toast.info(res.message);
                            await refreshRows();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        <Bell className="mr-1 size-3.5" />
                        Remind
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-rose-300/80"
                        disabled={busyId === r.id || r.status === OrgAssessmentAssignmentStatus.CANCELLED}
                        onClick={async () => {
                          setBusyId(r.id);
                          try {
                            await cancelOrgAssignment(r.id);
                            toast.success("Cancelled");
                            await refreshRows();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
