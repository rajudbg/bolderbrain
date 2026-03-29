"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompetencyHeatmapRow } from "@/lib/manager-dashboard";

function barFill(score: number): string {
  if (score < 3) return "#f43f5e";
  if (score < 3.7) return "#fbbf24";
  return "#34d399";
}

function EmptyState() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <p className="text-sm font-medium text-white/70">No team competency snapshots yet</p>
      <p className="mt-1 max-w-md text-xs text-white/45">
        When your direct reports complete 360 feedback, per-competency scores appear here as a team average.
      </p>
    </div>
  );
}

export function ManagerCompetencyHeatmapChart({ rows }: { rows: CompetencyHeatmapRow[] }) {
  const data = useMemo(
    () =>
      [...rows]
        .map((r) => ({
          key: r.competencyKey,
          label:
            r.competencyName.length > 28 ? `${r.competencyName.slice(0, 26)}…` : r.competencyName,
          fullLabel: r.competencyName,
          score: r.avgScore,
          n: r.sampleSize,
        }))
        .sort((a, b) => a.score - b.score),
    [rows],
  );

  if (data.length === 0) return <EmptyState />;

  const chartHeight = Math.min(560, 48 + data.length * 44);

  return (
    <div className="w-full min-w-0" style={{ height: chartHeight }}>
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
            barCategoryGap={12}
          >
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
              stroke="rgba(255,255,255,0.12)"
            />
            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
              stroke="rgba(255,255,255,0.12)"
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
              formatter={(value, _name, item) => {
                const num = typeof value === "number" ? value : Number(value);
                const payload = item?.payload as { n?: number } | undefined;
                const n = payload?.n;
                return [`${Number.isFinite(num) ? num.toFixed(2) : "—"} (n=${n ?? "—"})`, "Team avg (others)"];
              }}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as { fullLabel?: string } | undefined;
                return row?.fullLabel ?? "";
              }}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {data.map((e) => (
                <Cell key={e.key} fill={barFill(e.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Team average of others&apos; ratings per competency (latest snapshot per person). Scale typically 1–5.
      </p>
    </div>
  );
}
