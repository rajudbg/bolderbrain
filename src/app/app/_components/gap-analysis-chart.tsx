"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";

function gapColor(gap: number): string {
  if (gap < -0.1) return "#16a34a";
  if (gap > 0.1) return "#dc2626";
  return "#9ca3af";
}

function EmptyState() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <p className="text-sm font-medium text-white/70">No competency data available</p>
      <p className="mt-1 text-xs text-white/45">Complete a 360 assessment to see gap analysis</p>
    </div>
  );
}

export function GapAnalysisChart({ scores }: { scores: Assessment360StoredResult }) {
  const data = useMemo(
    () =>
      [...scores.byCompetency]
        .map((c) => ({
          name: c.competencyKey.length > 32 ? `${c.competencyKey.slice(0, 30)}…` : c.competencyKey,
          fullName: c.competencyKey,
          gap: c.gapSelfVsOthers,
        }))
        .sort((a, b) => a.gap - b.gap),
    [scores.byCompetency],
  );

  if (data.length === 0) return <EmptyState />;

  const chartHeight = Math.min(520, 48 + data.length * 44);

  return (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap={12}
          >
            <XAxis
              type="number"
              domain={[-2.5, 2.5]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(26,26,30,0.95)",
                backdropFilter: "blur(12px)",
              }}
              itemStyle={{ color: "rgba(255,255,255,0.9)" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}
              formatter={(value) => [
                typeof value === "number" ? value.toFixed(2) : String(value ?? "—"),
                "Gap (self − others)",
              ]}
            />
            <Bar dataKey="gap" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {data.map((e, i) => (
                <Cell key={i} fill={gapColor(e.gap)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#16a34a]" /> Self lower (humble)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#9ca3af]" /> Aligned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#dc2626]" /> Self higher
        </span>
      </p>
    </div>
  );
}
