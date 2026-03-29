"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompetencyTrend } from "@/lib/action-engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function deltaColor(d: number): string {
  if (d > 0.05) return "#10b981";
  if (d < -0.05) return "#f43f5e";
  return "#94a3b8";
}

export function CompetencyTrendsBlock({ trends }: { trends: CompetencyTrend[] }) {
  const withDelta = trends.filter((t) => t.deltaFromPrevious !== null);

  const chartData = useMemo(
    () =>
      withDelta.map((t) => ({
        name: t.competencyKey.length > 22 ? `${t.competencyKey.slice(0, 20)}…` : t.competencyKey,
        fullName: t.competencyKey,
        delta: t.deltaFromPrevious as number,
      })),
    [withDelta],
  );

  const chartHeight = Math.min(400, 56 + chartData.length * 36);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Improvement signals</CardTitle>
        <CardDescription>
          Change in others&apos; average rating vs your previous 360 (same competency).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {withDelta.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            After a second completed 360, you&apos;ll see how others&apos; ratings moved here.
          </p>
        ) : (
          <div className="space-y-6">
            {chartData.length > 0 && (
              <div className="w-full min-w-0" style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                    barCategoryGap={8}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={108}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      formatter={(v) => {
                        const n = typeof v === "number" ? v : Number(v);
                        return [Number.isFinite(n) ? n.toFixed(2) : "—", "Δ others avg"];
                      }}
                      labelFormatter={(_, payload) => {
                        const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                        return row?.fullName ?? "";
                      }}
                    />
                    <Bar dataKey="delta" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={deltaColor(e.delta)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="space-y-3">
              {withDelta.map((t) => (
                <li
                  key={t.competencyKey}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{t.competencyKey}</span>
                  <span className="text-muted-foreground flex items-center gap-1.5 tabular-nums">
                    {t.deltaFromPrevious! > 0.05 ? (
                      <>
                        <TrendingUp className="size-4 text-emerald-600" />
                        <span className="text-emerald-700">+{t.deltaFromPrevious!.toFixed(1)}</span>
                      </>
                    ) : t.deltaFromPrevious! < -0.05 ? (
                      <>
                        <TrendingDown className="size-4 text-rose-600" />
                        <span className="text-rose-700">{t.deltaFromPrevious!.toFixed(1)}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="text-muted-foreground size-4" />
                        <span>~{t.deltaFromPrevious!.toFixed(1)}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
