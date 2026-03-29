"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS = ["#34d399", "#818cf8", "#94a3b8"];

type MixRow = { name: string; count: number };
type EqRow = { domain: string; score: number };

export function DashboardAnalyticsCharts({
  assessmentMix,
  eqDomains,
}: {
  assessmentMix: MixRow[];
  eqDomains: EqRow[] | null;
}) {
  const mixTotal = useMemo(() => assessmentMix.reduce((s, x) => s + x.count, 0), [assessmentMix]);

  const showMix = mixTotal > 0;
  const showEq = eqDomains && eqDomains.length > 0;

  if (!showMix && !showEq) return null;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {showMix ? (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">360 activity</CardTitle>
            <CardDescription>Your recent feedback cycles by status (subject + evaluator roles).</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assessmentMix}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {assessmentMix.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, opacity: 0.75 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(26,26,30,0.95)",
                  }}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return [`${Number.isFinite(n) ? n : "—"} cycle${n === 1 ? "" : "s"}`, "Count"];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {showEq ? (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">EQ domain scores</CardTitle>
            <CardDescription>Latest emotional intelligence reflection (0–100).</CardDescription>
          </CardHeader>
          <CardContent className="h-[min(320px,50vh)] w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={eqDomains!}
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                barCategoryGap={10}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} />
                <YAxis
                  type="category"
                  dataKey="domain"
                  width={118}
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(26,26,30,0.95)",
                  }}
                  formatter={(v) => {
                    const n = typeof v === "number" ? v : Number(v);
                    return [`${Number.isFinite(n) ? n : "—"}`, "Score"];
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {eqDomains!.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#a855f7" : "#38bdf8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
