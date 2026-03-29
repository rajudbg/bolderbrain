"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <p className="text-sm font-medium text-white/70">No assessment activity</p>
      <p className="mt-1 text-xs text-white/45">Complete assessments to see activity data</p>
    </div>
  );
}

export function UsageMiniChart({ data }: { data: { name: string; value: number }[] }) {
  const hasData = data.some(d => d.value > 0);
  
  if (!hasData) return <EmptyState />;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }} stroke="rgba(255,255,255,0.1)" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }} stroke="rgba(255,255,255,0.1)" />
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
        />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
