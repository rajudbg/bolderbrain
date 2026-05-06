"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompletionFunnel, HeatmapCell } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

/* ─── Color palette ─── */
const CHART_COLORS = [
  "#818cf8", "#c084fc", "#f472b6", "#60a5fa",
  "#34d399", "#fbbf24", "#fb923c", "#f87171",
];

/* ─── Score to heatmap color ─── */
function scoreColor(value: number | null): string {
  if (value == null) return "rgba(255,255,255,0.03)";
  if (value < 2) return "rgba(239,68,68,0.45)";
  if (value < 3) return "rgba(245,158,11,0.35)";
  if (value < 3.5) return "rgba(59,130,246,0.30)";
  return "rgba(16,185,129,0.40)";
}

/* ─── Empty states ─── */
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
      <p className="text-sm text-white/45">{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   1. Competency Trends — Area/Line Chart
   ═══════════════════════════════════════════ */

export function CompetencyTrendChart({
  series,
  competencies,
}: {
  series: Record<string, { week: string; avg: number }[]>;
  competencies: string[];
}) {
  const [visible, setVisible] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (let i = 0; i < Math.min(competencies.length, 4); i++) initial.add(competencies[i]!);
    return initial;
  });

  const data = useMemo(() => {
    const weekSet = new Set<string>();
    for (const ck of competencies) {
      for (const pt of series[ck] ?? []) weekSet.add(pt.week);
    }
    const weeks = [...weekSet].sort();
    return weeks.map((w) => {
      const row: Record<string, string | number> = { week: w };
      for (const ck of competencies) {
        const pt = (series[ck] ?? []).find((p) => p.week === w);
        row[ck] = pt?.avg ?? 0;
      }
      return row;
    });
  }, [series, competencies]);

  const toggle = (ck: string) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(ck)) next.delete(ck);
      else next.add(ck);
      return next;
    });

  if (data.length === 0) return <EmptyChart message="No competency trend data available yet" />;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {competencies.map((ck, i) => {
          const active = visible.has(ck);
          return (
            <button
              key={ck}
              type="button"
              onClick={() => toggle(ck)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                active
                  ? "text-white"
                  : "border-white/10 bg-white/[0.03] text-white/40",
              )}
              style={active ? { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] } : {}}
            >
              {ck}
            </button>
          );
        })}
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="week"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.08)"
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.08)"
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(26,26,30,0.95)",
              }}
              itemStyle={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}
              labelStyle={{ color: "rgba(255,255,255,0.55)", marginBottom: 4, fontSize: 11 }}
              formatter={(v: unknown) => [typeof v === "number" ? v.toFixed(2) : String(v), ""]}
            />
            {competencies.map((ck, i) =>
              visible.has(ck) ? (
                <Area
                  key={ck}
                  type="monotone"
                  dataKey={ck}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ) : null,
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. Competency Heatmap Grid
   ═══════════════════════════════════════════ */

export function CompetencyHeatmapGrid({
  rows,
  cols,
  cells,
}: {
  rows: string[];
  cols: string[];
  cells: HeatmapCell[];
}) {
  if (rows.length === 0 || cols.length === 0) {
    return <EmptyChart message="No department-level competency data available" />;
  }

  const getColor = (ck: string, dept: string) => {
    const c = cells.find((cell) => cell.competencyKey === ck && cell.department === dept);
    return scoreColor(c?.avg ?? null);
  };

  const getValue = (ck: string, dept: string) => {
    const c = cells.find((cell) => cell.competencyKey === ck && cell.department === dept);
    return c?.avg != null ? c.avg.toFixed(1) : "—";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#0F0F11] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-white/40">
              Competency
            </th>
            {cols.map((dept) => (
              <th
                key={dept}
                className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/40"
              >
                {dept}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ck) => (
            <tr key={ck}>
              <td className="sticky left-0 z-10 bg-[#0F0F11] px-2 py-1.5 font-medium text-white/70">
                {ck}
              </td>
              {cols.map((dept) => (
                <td
                  key={dept}
                  className="px-2 py-1.5 text-center text-[11px] text-white/70 transition-colors hover:opacity-80"
                  style={{ backgroundColor: getColor(ck, dept), borderRadius: 4 }}
                  title={`${ck} · ${dept}: ${getValue(ck, dept)}`}
                >
                  {getValue(ck, dept)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. Completion Funnel — Horizontal Bar
   ═══════════════════════════════════════════ */

const FUNNEL_COLORS = ["#818cf8", "#a78bfa", "#c084fc", "#34d399"];

export function CompletionFunnelChart({ data }: { data: CompletionFunnel[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <EmptyChart message="No assessment funnel data for this period" />;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((stage, i) => {
        const pct = Math.round((stage.count / maxVal) * 100);
        const convRate =
          i > 0 && data[i - 1]!.count > 0
            ? Math.round((stage.count / data[i - 1]!.count) * 100) + "%"
            : "100%";
        return (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white/80">{stage.stage}</span>
              <div className="flex items-center gap-3">
                <span className="text-white/40 font-mono">{stage.count}</span>
                <span className={cn("text-[10px]", i === 0 ? "text-white/30" : "text-emerald-400/80")}>
                  {convRate}
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}