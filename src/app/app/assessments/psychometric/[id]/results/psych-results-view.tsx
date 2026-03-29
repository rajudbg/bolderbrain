"use client";

import { useMemo, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OCEAN_TRAITS, oceanDisplayName } from "@/lib/ocean-traits";

const TRAIT_BLURBS: Record<string, string> = {
  Openness:
    "Interest in ideas, novelty, and imagination — higher scores often enjoy exploration and variety.",
  Conscientiousness:
    "Organization, follow-through, and reliability — higher scores often prefer structure and planning.",
  Extraversion:
    "Energy from social interaction and assertiveness — higher scores often seek stimulation and connection.",
  Agreeableness:
    "Cooperation, trust, and empathy — higher scores often prioritize harmony and helping others.",
  Neuroticism:
    "Emotional reactivity and stress sensitivity — higher scores may notice mood shifts more readily (not a disorder).",
};

export function PsychResultsView({
  templateName,
  submittedAt,
  result,
  roleProfileKeys,
}: {
  templateName: string;
  submittedAt: string | null;
  result: {
    traitPercentiles: Record<string, number>;
    validityFlags: {
      inconsistencyWarning: boolean;
      socialDesirabilityWarning: boolean;
      speedWarning: boolean;
      messages: string[];
    };
    roleMatches: Record<string, number>;
    teamDynamicsText: string;
    careerInsightsText: string;
    summaryLine: string;
    radarPayload: {
      traits: string[];
      user: number[];
      population: number[];
      idealLeadership?: number[];
    };
  };
  roleProfileKeys: string[];
}) {
  const [visible, setVisible] = useState({ you: true, avg: true, ideal: true });

  const radarData = useMemo(() => {
    const { traits, user, population, idealLeadership } = result.radarPayload;
    return traits.map((t, i) => ({
      trait: t.length > 14 ? `${t.slice(0, 12)}…` : t,
      traitFull: t,
      You: user[i] ?? 0,
      Average: population[i] ?? 50,
      Ideal: idealLeadership?.[i] ?? null,
    }));
  }, [result.radarPayload]);

  return (
    <div className="from-violet-50/40 via-background min-h-screen bg-gradient-to-b to-background dark:from-violet-950/20">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <header className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-violet-700 uppercase dark:text-violet-400">
            Personality profile
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{templateName}</h1>
          {submittedAt ? (
            <p className="text-muted-foreground text-sm">Completed {new Date(submittedAt).toLocaleString()}</p>
          ) : null}
          <div className="flex items-start gap-2 rounded-lg border border-violet-200/50 bg-violet-50/35 px-3 py-2 text-xs text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/25 dark:text-violet-100/90">
            <Lock className="mt-0.5 size-3.5 shrink-0 opacity-80" />
            <span>
              This describes tendencies, not worth or fixed limits. Share thoughtfully — personality data is personal.
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{result.summaryLine}</p>
        </header>

        {(result.validityFlags.inconsistencyWarning ||
          result.validityFlags.socialDesirabilityWarning ||
          result.validityFlags.speedWarning) && (
          <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/15">
            <CardHeader>
              <CardTitle className="text-base">Validity flags</CardTitle>
              <CardDescription>Rule-based checks — use as context, not judgment.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {result.validityFlags.messages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="border-violet-200/45 dark:border-violet-900/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
              <CardTitle className="text-lg">Big Five radar</CardTitle>
            </div>
            <CardDescription>Percentile-style scores (0–100) vs reference line and optional leadership ideal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["you", "You", "hsl(262 83% 58%)"],
                  ["avg", "Population avg", "hsl(220 14% 46%)"],
                  ["ideal", "Ideal (leadership)", "hsl(291 47% 51%)"],
                ] as const
              ).map(([k, label, color]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    opacity: visible[k as keyof typeof visible] ? 1 : 0.45,
                    borderColor: color,
                    color: visible[k as keyof typeof visible] ? color : "inherit",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="h-[380px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid 
                    stroke="rgba(255,255,255,0.1)" 
                    fill="rgba(255,255,255,0.02)"
                  />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                  {visible.you && (
                    <Radar
                      name="You"
                      dataKey="You"
                      stroke="hsl(262 83% 58%)"
                      fill="hsl(262 83% 58%)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  )}
                  {visible.avg && (
                    <Radar
                      name="Population avg"
                      dataKey="Average"
                      stroke="hsl(220 14% 46%)"
                      fill="hsl(220 14% 46%)"
                      fillOpacity={0.08}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                  {visible.ideal && (
                    <Radar
                      name="Ideal (leadership)"
                      dataKey="Ideal"
                      stroke="hsl(291 47% 51%)"
                      fill="hsl(291 47% 51%)"
                      fillOpacity={0.1}
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
                    formatter={(value) => [
                      typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—",
                      "Score",
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {OCEAN_TRAITS.map((t) => {
            const p = result.traitPercentiles[t] ?? 0;
            return (
              <Card key={t} className="border-violet-200/40 dark:border-violet-900/25">
                <CardHeader>
                  <CardTitle className="text-base">{oceanDisplayName(t)}</CardTitle>
                  <CardDescription>~{p.toFixed(0)}th percentile (within this assessment)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{TRAIT_BLURBS[t]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {roleProfileKeys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role fit (optional)</CardTitle>
              <CardDescription>Compared to template "ideal" profiles — illustrative only.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {roleProfileKeys.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-lg border border-violet-200/35 px-3 py-2 dark:border-violet-900/30"
                >
                  <span className="text-sm capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-violet-700 dark:text-violet-300 font-semibold tabular-nums">
                    {result.roleMatches[k] ?? 0}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team dynamics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{result.teamDynamicsText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Career insights & watch-outs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{result.careerInsightsText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
