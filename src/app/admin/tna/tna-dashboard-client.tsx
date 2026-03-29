"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GapSeverity, TrainingNeedSource, TrainingNeedStatus } from "@/generated/prisma/enums";
import { bulkAssignNeedsToProgram, runAiRecommendProgram, runStrategicGapBrief, runTrendForecastBrief } from "./actions";
import { StatusBadge, SourceBadge } from "@/components/ui/status-badge";
import { getSourceLabel, getStatusConfig } from "@/lib/ui-labels";

type NeedRow = {
  id: string;
  gap: number;
  priority: number;
  source: TrainingNeedSource;
  status: TrainingNeedStatus;
  notes: string | null;
  user: { name: string | null; email: string | null };
  competency: { id: string; key: string; name: string };
  assignedProgram: { name: string } | null;
};

type InvRow = {
  userId: string;
  competencyId: string;
  gap: number;
  severity: GapSeverity;
  currentScore: number;
  targetScore: number;
  user: { name: string | null; email: string | null };
  competency: { key: string; name: string };
};

type ProgramOpt = { id: string; name: string };

type CompOpt = { id: string; key: string; name: string };

function severityCellClass(s: GapSeverity): string {
  switch (s) {
    case "CRITICAL":
      return "bg-red-600/75 text-white";
    case "HIGH":
      return "bg-amber-500/65 text-black";
    case "MET":
      return "bg-emerald-500/50 text-black";
    case "EXCEEDS":
      return "bg-sky-500/55 text-white";
    default:
      return "bg-white/10 text-white/80";
  }
}

export function TnaDashboardClient(props: {
  needs: NeedRow[];
  inventory: InvRow[];
  competencies: CompOpt[];
  programs: ProgramOpt[];
  criticalQueue: NeedRow[];
  summaryPct: { atStandard: number; withGaps: number; exceeding: number };
  memberCount: number;
  /** When true, show summary + heatmap only (manager team view). */
  teamMode?: boolean;
}) {
  const { needs, inventory, competencies, programs, criticalQueue, summaryPct, memberCount, teamMode } = props;

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [compFilter, setCompFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [aiOrg, setAiOrg] = useState<string | null>(null);
  const [aiTrend, setAiTrend] = useState<string | null>(null);
  const [pendingAi, startAi] = useTransition();
  const [pendingBulk, startBulk] = useTransition();

  const userOrder = useMemo(() => {
    const ids = [...new Set(inventory.map((r) => r.userId))];
    return ids.sort((a, b) => a.localeCompare(b));
  }, [inventory]);

  const invMap = useMemo(() => {
    const m = new Map<string, InvRow>();
    for (const r of inventory) {
      m.set(`${r.userId}:${r.competencyId}`, r);
    }
    return m;
  }, [inventory]);

  const filteredNeeds = useMemo(() => {
    return needs.filter((n) => {
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (sourceFilter !== "all" && n.source !== sourceFilter) return false;
      if (compFilter !== "all" && n.competency.id !== compFilter) return false;
      return true;
    });
  }, [needs, statusFilter, sourceFilter, compFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const ids = filteredNeeds.map((n) => n.id);
    setSelected((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  }

  return (
    <div className="space-y-10">
      {teamMode && (
        <p className="max-w-3xl rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Team view: same skills matrix as org TNA. Use gaps to open training needs and assign programs from the full{" "}
          <Link href="/admin/tna" className="font-medium underline underline-offset-2">
            TNA dashboard
          </Link>
          .
        </p>
      )}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <p className="text-caption-cerebral text-white/45">At standard</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-white/90">{summaryPct.atStandard}%</p>
          <p className="mt-1 text-xs text-white/40">Inventory cells meeting target</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <p className="text-caption-cerebral text-white/45">With gaps</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-amber-300/90">{summaryPct.withGaps}%</p>
          <p className="mt-1 text-xs text-white/40">Development opportunity</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <p className="text-caption-cerebral text-white/45">Exceeding target</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-sky-300/90">{summaryPct.exceeding}%</p>
          <p className="mt-1 text-xs text-white/40">Ahead of proficiency bar</p>
        </div>
      </section>

      {!teamMode && (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-white/90">Priority queue</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/50">Critical gaps first (gap &gt; 1.5)</p>
          </div>
          <Badge className="w-fit border border-amber-500/40 bg-amber-500/15 text-amber-200">TNA</Badge>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Person</TableHead>
                <TableHead className="text-white/50">Competency</TableHead>
                <TableHead className="text-right text-white/50">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criticalQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-white/45">
                    No critical gaps in queue.
                  </TableCell>
                </TableRow>
              ) : (
                criticalQueue.map((n) => (
                  <TableRow key={n.id} className="border-white/[0.06]">
                    <TableCell className="font-medium text-white/85">{n.user.name ?? n.user.email}</TableCell>
                    <TableCell className="text-white/70">{n.competency.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-300">{n.gap.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-white/90">Organization heatmap</h2>
        <p className="max-w-3xl text-sm text-white/50">
          Employees × competencies — hover for scores. Colors: critical (red), high (amber), met (green), exceeds (blue).
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0F0F11] px-2 py-2 text-left font-medium text-white/55">
                  Employee
                </th>
                {competencies.map((c) => (
                  <th key={c.id} className="min-w-[100px] px-1 py-2 text-center font-medium text-white/45">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userOrder.map((uid) => {
                const label =
                  inventory.find((r) => r.userId === uid)?.user.name ??
                  inventory.find((r) => r.userId === uid)?.user.email ??
                  uid;
                return (
                  <tr key={uid}>
                    <td className="sticky left-0 z-10 bg-[#0F0F11]/95 px-2 py-1 text-white/75">{label}</td>
                    {competencies.map((c) => {
                      const cell = invMap.get(`${uid}:${c.id}`);
                      if (!cell) {
                        return (
                          <td key={c.id} className="border border-white/[0.04] p-0">
                            <div className="h-8 bg-white/[0.03]" title="No snapshot" />
                          </td>
                        );
                      }
                      return (
                        <td key={c.id} className="border border-white/[0.04] p-0">
                          <div
                            className={`flex h-8 items-center justify-center px-0.5 ${severityCellClass(cell.severity)}`}
                            title={`${cell.competency.name}: current ${cell.currentScore.toFixed(2)} / target ${cell.targetScore.toFixed(2)} (gap ${cell.gap.toFixed(2)})`}
                          >
                            {cell.gap.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-white/35">~{memberCount} members in org · {inventory.length} inventory cells</p>
      </section>

      {!teamMode && (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-white/90">Training needs</h2>
            <p className="mt-1 text-sm text-white/50">Filter, select, assign to a training program.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[160px] border-white/15 bg-white/[0.04] text-white/85">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="OPEN">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getStatusConfig("OPEN").icon; return <C className="size-3.5 text-amber-400" />; })()}
                    Open
                  </span>
                </SelectItem>
                <SelectItem value="ASSIGNED">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getStatusConfig("ASSIGNED").icon; return <C className="size-3.5 text-blue-400" />; })()}
                    Assigned
                  </span>
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getStatusConfig("IN_PROGRESS").icon; return <C className="size-3.5 text-indigo-400" />; })()}
                    In Progress
                  </span>
                </SelectItem>
                <SelectItem value="RESOLVED">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getStatusConfig("RESOLVED").icon; return <C className="size-3.5 text-emerald-400" />; })()}
                    Resolved
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
              <SelectTrigger className="w-[200px] border-white/15 bg-white/[0.04] text-white/85">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="TNA_ASSESSMENT">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getSourceLabel("TNA_ASSESSMENT").icon; return <C className="size-3.5 text-purple-400" />; })()}
                    TNA Assessment
                  </span>
                </SelectItem>
                <SelectItem value="MANAGER_NOMINATION">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getSourceLabel("MANAGER_NOMINATION").icon; return <C className="size-3.5 text-amber-400" />; })()}
                    Manager Nomination
                  </span>
                </SelectItem>
                <SelectItem value="SELF_IDENTIFIED">
                  <span className="inline-flex items-center gap-2">
                    {(() => { const C = getSourceLabel("SELF_IDENTIFIED").icon; return <C className="size-3.5 text-cyan-400" />; })()}
                    Self-Identified
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={compFilter} onValueChange={(v) => setCompFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px] border-white/15 bg-white/[0.04] text-white/85">
                <SelectValue placeholder="Competency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All competencies</SelectItem>
                {competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Select value={programId} onValueChange={(v) => setProgramId(v ?? "")}>
            <SelectTrigger className="min-w-[220px] border-white/15 bg-white/[0.04] text-white/85">
              <SelectValue placeholder="Training program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={selected.size === 0 || !programId || pendingBulk}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-95"
            onClick={() => {
              startBulk(async () => {
                try {
                  await bulkAssignNeedsToProgram({ needIds: [...selected], programId });
                  toast.success("Assigned to program");
                  setSelected(new Set());
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              });
            }}
          >
            {pendingBulk ? "Assigning…" : "Assign selected"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={filteredNeeds.length > 0 && filteredNeeds.every((n) => selected.has(n.id))}
                    onCheckedChange={() => toggleAllVisible()}
                  />
                </TableHead>
                <TableHead className="text-white/50">Person</TableHead>
                <TableHead className="text-white/50">Competency</TableHead>
                <TableHead className="text-white/50">Source</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-right text-white/50">Gap</TableHead>
                <TableHead className="text-white/50">Program</TableHead>
                <TableHead className="text-white/50 w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNeeds.map((n) => (
                <TableRow key={n.id} className="border-white/[0.06]">
                  <TableCell>
                    <Checkbox checked={selected.has(n.id)} onCheckedChange={() => toggle(n.id)} />
                  </TableCell>
                  <TableCell className="font-medium text-white/85">{n.user.name ?? n.user.email}</TableCell>
                  <TableCell className="text-white/70">{n.competency.name}</TableCell>
                  <TableCell className="text-white/55">
                    <SourceBadge source={n.source} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={n.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-white/80">{n.gap.toFixed(2)}</TableCell>
                  <TableCell className="text-white/55">{n.assignedProgram?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-amber-400/90 hover:text-amber-300"
                      onClick={() => {
                        void runAiRecommendProgram({
                          competencyName: n.competency.name,
                          gap: n.gap,
                          roleHint: "employee",
                        }).then((text) => {
                          toast.message("AI recommendation", { description: text.slice(0, 400) });
                        });
                      }}
                    >
                      AI
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      )}

      {!teamMode && (
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold text-white/90">Strategic L&amp;D brief</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 text-white/80"
              disabled={pendingAi}
              onClick={() => {
                startAi(async () => {
                  const text = await runStrategicGapBrief();
                  setAiOrg(text);
                });
              }}
            >
              {pendingAi ? "…" : "Run AI"}
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60">{aiOrg ?? "Run analysis to synthesize budget and cohort recommendations."}</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold text-white/90">Trend forecast</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 text-white/80"
              disabled={pendingAi}
                onClick={() => {
                startAi(async () => {
                  const text = await runTrendForecastBrief();
                  setAiTrend(text);
                });
              }}
            >
              {pendingAi ? "…" : "Run AI"}
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60">{aiTrend ?? "Connect quarterly TNA snapshots to unlock forecasting."}</p>
        </div>
      </section>
      )}
    </div>
  );
}
