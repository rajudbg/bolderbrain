"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export function DevelopmentRadarChart({
  data,
}: {
  data: { competency: string; Current: number; Target: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Complete a TNA diagnostic or 360 assessment to populate competency scores.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="competency" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fill: "rgba(255,255,255,0.35)" }} />
        <Radar name="Current" dataKey="Current" stroke="#818cf8" fill="#818cf8" fillOpacity={0.35} />
        <Radar name="Target" dataKey="Target" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.22} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
