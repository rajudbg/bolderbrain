"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, CalendarPlus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  cancelAssessment,
  extend360DueDate,
  send360Reminder,
} from "@/app/admin/hr-actions";
import type { Feedback360Row } from "@/lib/admin/queries";
import { AssessmentInstanceStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

function initials(name: string | null, email: string | null): string {
  if (name?.trim()) {
    const p = name.trim().split(/\s+/);
    const a = p[0]?.[0] ?? "";
    const b = p.length > 1 ? p[p.length - 1]?.[0] ?? "" : "";
    return (a + b).toUpperCase().slice(0, 2) || "?";
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function StatusDot({ row }: { row: Feedback360Row }) {
  const overdue = row.dueAt ? new Date(row.dueAt) < new Date() : false;
  if (row.status === AssessmentInstanceStatus.CANCELLED) {
    return (
      <span
        className="inline-flex size-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.55)] motion-reduce:animate-none"
        title="Cancelled"
      />
    );
  }
  if (row.status === AssessmentInstanceStatus.COMPLETED) {
    return (
      <span
        className="inline-flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] motion-reduce:shadow-md animate-pulse"
        title="Completed"
      />
    );
  }
  if (row.status === AssessmentInstanceStatus.DRAFT) {
    return <span className="inline-flex size-2.5 rounded-full bg-white/20" title="Draft" />;
  }
  if (overdue) {
    return (
      <span
        className="inline-flex size-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] motion-reduce:animate-none animate-pulse"
        title="Overdue"
      />
    );
  }
  if (row.stalled) {
    return (
      <span
        className="inline-flex size-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        title="Stalled"
      />
    );
  }
  return (
    <span
      className="inline-flex size-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.45)] motion-reduce:animate-none animate-pulse"
      title="In progress"
    />
  );
}

function ProgressRing({ pct, gradId }: { pct: number; gradId: string }) {
  const size = 72;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, pct));
  const offset = c * (1 - p / 100);
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function Timeline({ row }: { row: Feedback360Row }) {
  const fullyDone =
    row.evaluatorTotal > 0 ? row.evaluatorDone >= row.evaluatorTotal : row.progressPct >= 100;
  const steps = [
    { label: "Self", done: row.selfComplete },
    { label: "Peers", done: row.peersComplete },
    { label: "Manager", done: row.managerComplete },
    { label: "Done", done: fullyDone },
  ];
  let currentIdx = steps.findIndex((s) => !s.done);
  if (currentIdx === -1) currentIdx = steps.length - 1;

  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-between gap-1">
        <div
          className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-fuchsia-500/40"
          aria-hidden
        />
        {steps.map((s, i) => {
          const isDone = s.done;
          const isCurrent = i === currentIdx && !isDone;
          return (
            <div key={s.label} className="relative z-10 flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-[10px] font-semibold",
                  isDone && "border-indigo-400/60 bg-indigo-500/25 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]",
                  !isDone && isCurrent && "border-amber-400/70 bg-amber-500/20 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)] motion-reduce:animate-none animate-pulse",
                  !isDone && !isCurrent && "border-white/15 bg-[#0F0F11] text-white/35",
                )}
              >
                {isDone ? <Check className="size-4 text-indigo-200" /> : i + 1}
              </div>
              <span className="text-[10px] text-white/45">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function dueClass(dueAt: string | null): string {
  if (!dueAt) return "text-white/45";
  const d = new Date(dueAt);
  const now = Date.now();
  if (d.getTime() < now) return "text-rose-400";
  const days = (d.getTime() - now) / 86400000;
  if (days <= 3) return "text-amber-400";
  if (days <= 7) return "text-amber-200/80";
  return "text-white/70";
}

export function Feedback360AssignmentCards({ rows }: { rows: Feedback360Row[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulkRemind() {
    setBusy("bulk");
    try {
      const messages: string[] = [];
      for (const id of selected) {
        const r = await send360Reminder(id);
        messages.push(r.message);
      }
      toast.success(messages[messages.length - 1] ?? "Reminders processed.");
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={selected.size === 0 || busy !== null}
          onClick={() => void bulkRemind()}
        >
          Send reminder to selected
        </Button>
        <span className="text-xs text-white/45">{selected.size} selected</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center text-sm text-white/50">
          No 360 assessments for this organization yet.
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selected.has(r.id)}
                  onCheckedChange={() => toggle(r.id)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-indigo-500"
                />
                <div className="relative">
                  <ProgressRing pct={r.progressPct} gradId={`f360-ring-${r.id}`} />
                  <span className="font-data absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-white/90">
                    {r.progressPct}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusDot row={r} />
                    <span className="font-heading text-lg font-semibold text-white/90">
                      {r.subjectName ?? "Subject"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/45">{r.subjectEmail}</p>
                  <p className="mt-1 text-sm text-white/55">{r.templateName}</p>
                  <p className="mt-2 text-xs text-white/50">
                    {r.evaluatorDone} of {r.evaluatorTotal} evaluators complete
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-xs font-semibold text-white/85">
                      {initials(r.subjectName, r.subjectEmail)}
                    </span>
                    <span className="text-[10px] text-white/40">Subject · evaluators submit in parallel</span>
                  </div>
                  <p className={cn("mt-2 text-xs font-medium", dueClass(r.dueAt))}>
                    Due: {r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              <Timeline row={r} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1 opacity-90 transition-opacity hover:bg-white/[0.07]">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 text-white/40 hover:bg-transparent hover:text-white/90"
                    disabled={busy === r.id}
                    title="Remind"
                    onClick={async () => {
                      setBusy(r.id);
                      try {
                        const res = await send360Reminder(r.id);
                        toast.success(res.message);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <Bell className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 text-indigo-400/80 hover:bg-transparent hover:text-indigo-300"
                    disabled={busy === r.id}
                    title="Extend 14d"
                    onClick={async () => {
                      setBusy(r.id);
                      try {
                        await extend360DueDate(r.id, 14);
                        toast.success("Extended 14 days.");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <CalendarPlus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 text-rose-400/60 hover:bg-transparent hover:text-rose-400"
                    disabled={busy === r.id}
                    title="Cancel"
                    onClick={async () => {
                      if (!confirm("Cancel this 360?")) return;
                      setBusy(r.id);
                      try {
                        await cancelAssessment(r.id);
                        toast.success("Cancelled.");
                        window.location.reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/35">{r.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
