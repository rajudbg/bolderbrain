"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Assessment360StoredResult } from "@/lib/assessment-360-result";
import { cn } from "@/lib/utils";

const COLORS = {
  self: "#818cf8",
  peer: "#34d399",
  manager: "#e879f9",
} as const;

type SeriesKey = keyof typeof COLORS;

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <p className="text-sm font-medium text-white/70">No behavior data available</p>
      <p className="mt-1 text-xs text-white/45">Complete a 360 assessment to see your competency radar</p>
    </div>
  );
}

export function BehaviorRadar({ scores }: { scores: Assessment360StoredResult }) {
  const data = useMemo(() => {
    return scores.byCompetency.map((c) => ({
      competency:
        c.competencyKey.length > 24 ? `${c.competencyKey.slice(0, 22)}…` : c.competencyKey,
      competencyFull: c.competencyKey,
      self: c.self ?? null,
      peer: c.peerAvg ?? null,
      manager: c.manager ?? null,
    }));
  }, [scores.byCompetency]);

  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    self: true,
    peer: true,
    manager: true,
  });

  const toggle = (k: SeriesKey) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  if (data.length === 0) return <EmptyState />;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(COLORS) as SeriesKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => toggle(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              visible[k]
                ? "border-transparent text-white shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                : "border-white/10 bg-white/[0.04] text-white/50 opacity-80",
            )}
            style={
              visible[k]
                ? { backgroundColor: COLORS[k] }
                : { borderColor: COLORS[k], color: COLORS[k] }
            }
          >
            {k === "self" ? "Self" : k === "peer" ? "Peer avg" : "Manager"}
          </button>
        ))}
      </div>
      <div className="h-[380px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid 
              stroke="rgba(255,255,255,0.1)" 
              fill="rgba(255,255,255,0.02)"
            />
            <PolarAngleAxis dataKey="competency" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
            {visible.self && (
              <Radar
                name="Self"
                dataKey="self"
                stroke={COLORS.self}
                fill={COLORS.self}
                fillOpacity={0.35}
                strokeWidth={2}
                connectNulls
              />
            )}
            {visible.peer && (
              <Radar
                name="Peer avg"
                dataKey="peer"
                stroke={COLORS.peer}
                fill={COLORS.peer}
                fillOpacity={0.28}
                strokeWidth={2}
                connectNulls
              />
            )}
            {visible.manager && (
              <Radar
                name="Manager"
                dataKey="manager"
                stroke={COLORS.manager}
                fill={COLORS.manager}
                fillOpacity={0.28}
                strokeWidth={2}
                connectNulls
              />
            )}
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(26,26,30,0.95)",
                backdropFilter: "blur(12px)",
              }}
              itemStyle={{ color: "rgba(255,255,255,0.9)" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}
              formatter={(value, name) => [
                typeof value === "number" ? value.toFixed(2) : String(value ?? "—"),
                String(name),
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
