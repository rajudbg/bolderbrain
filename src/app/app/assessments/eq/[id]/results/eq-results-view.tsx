"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Heart, TrendingUp, Sparkles } from "lucide-react";
import { EqAmbientBackground, glassCardClassName } from "@/components/cerebral-glass";
import { Button } from "@/components/ui/button";
import { EQ_DOMAIN_RESOURCES } from "@/lib/eq-resources";
import { domainDisplayName, EQ_DOMAIN_KEYS, type EqDomainKey } from "@/lib/eq-domains";
import { cn } from "@/lib/utils";

const THERMAL_GRADIENT =
  "linear-gradient(to right, #1e3a8a 0%, #4f46e5 22%, #a855f7 48%, #ec4899 72%, #fb923c 100%)";

const DOMAIN_BAR_SHORT: Record<EqDomainKey, string> = {
  SelfAwareness: "Aware",
  SelfRegulation: "Regul",
  Motivation: "Motiv",
  Empathy: "Empathy",
  SocialSkills: "Social",
};

function thermalHex(score: number): string {
  const t = Math.min(100, Math.max(0, score));
  if (t < 20) return "#1e3a8a";
  if (t < 40) return "#4f46e5";
  if (t < 60) return "#a855f7";
  if (t < 80) return "#ec4899";
  return "#fb923c";
}

function domainInsightLine(key: EqDomainKey, score: number): string {
  const r = EQ_DOMAIN_RESOURCES[key];
  const base = r?.summary?.split(".")[0] ?? "Keep building habits that reinforce this domain.";
  if (score >= 75) return `${base} Your responses suggest strength here.`;
  if (score >= 50) return `${base} Solid foundation — small experiments can deepen impact.`;
  return `${base} A practical place to focus curiosity and practice.`;
}

function scoreVariance(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const v = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
  return Math.sqrt(v);
}

export function EqResultsView({
  templateName,
  submittedAt,
  result,
}: {
  templateName: string;
  submittedAt: string | null;
  result: {
    domainScores: Record<EqDomainKey, number>;
    compositeScore: number;
    percentileComposite: number;
    percentileByDomain: Record<EqDomainKey, number>;
    highestDomain: EqDomainKey;
    lowestDomain: EqDomainKey;
    consistencyFlags: string[];
    narrativeText: string;
    quadrantLabel: string;
    heatmapPosition: { x: number; y: number };
    previousSnapshot: {
      compositeScore: number;
      domainScores: Record<EqDomainKey, number>;
      completedAt: string | null;
    } | null;
  };
}) {
  const [showCompare, setShowCompare] = useState(false);
  const prev = result.previousSnapshot;
  const { x, y } = result.heatmapPosition;

  const domainValues = useMemo(
    () => EQ_DOMAIN_KEYS.map((k) => result.domainScores[k] ?? 0),
    [result.domainScores],
  );
  const variance = useMemo(() => scoreVariance(domainValues), [domainValues]);

  const barData = useMemo(
    () =>
      EQ_DOMAIN_KEYS.map((k) => ({
        key: k,
        short: DOMAIN_BAR_SHORT[k],
        score: Math.min(100, result.domainScores[k] ?? 0),
        percentile: result.percentileByDomain[k] ?? 0,
      })),
    [result.domainScores, result.percentileByDomain],
  );

  const balanceLabel =
    variance < 8
      ? "Your profile is unusually even — versatility across domains."
      : variance < 15
        ? "Balanced with a few standout peaks — leverage strengths while nudging weaker areas."
        : "Higher spread between domains — prioritize the lowest area for sustainable growth.";

  return (
    <div className="relative min-h-screen bg-[#0F0F11] text-white">
      <EqAmbientBackground />

      <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="space-y-2 text-center md:text-left">
          <p className="text-caption-cerebral">Emotional intelligence</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-5xl">
            Your EQ Profile
          </h1>
          <p className="text-lg text-white/70">{templateName}</p>
          {submittedAt ? (
            <p className="text-sm text-white/50">Completed {new Date(submittedAt).toLocaleString()}</p>
          ) : null}
          <p className="mx-auto max-w-2xl text-sm text-white/55 md:mx-0">
            EQ can be developed over time — use this as a mirror, not a label.
          </p>
        </header>

        {/* Composite — pulsing amber ring */}
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-caption-cerebral mb-4">Composite</p>
          <div className="relative flex size-44 items-center justify-center md:size-52">
            <div
              className="absolute inset-0 rounded-full opacity-90 motion-reduce:animate-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.35), transparent 65%), conic-gradient(from 180deg, rgba(251,146,60,0.5), rgba(245,158,11,0.15), rgba(251,146,60,0.5))",
                animation: "cerebral-pulse-glow 2.4s ease-in-out infinite",
              }}
            />
            <div className="bg-[#0F0F11]/90 absolute inset-[5px] flex flex-col items-center justify-center rounded-full border border-amber-500/25 shadow-[inset_0_0_40px_rgba(251,146,60,0.08)]">
              <span className="font-data text-5xl font-bold tabular-nums text-white md:text-6xl">
                {Math.round(result.compositeScore)}
              </span>
              <span className="mt-1 text-xs font-medium uppercase tracking-widest text-white/50">
                Emotional Intelligence
              </span>
              <span className="font-data mt-2 text-sm text-amber-300/90">
                ~{result.percentileComposite.toFixed(0)}th percentile
              </span>
            </div>
          </div>
        </div>

        {/* Domain cards — stagger */}
        <div>
          <h2 className="font-heading mb-4 text-lg font-semibold text-white/90">Domain breakdown</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {EQ_DOMAIN_KEYS.map((k, i) => {
              const v = Math.min(100, result.domainScores[k] ?? 0);
              const pct = result.percentileByDomain[k] ?? 0;
              return (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={cn(
                      glassCardClassName("flex h-full flex-col p-4"),
                      "border-white/10 bg-white/[0.02] backdrop-blur-xl",
                    )}
                  >
                    <p className="font-heading text-sm font-semibold text-white/90">{domainDisplayName(k)}</p>
                    <p className="font-data mt-2 text-3xl font-bold tabular-nums text-transparent bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text">
                      {v.toFixed(0)}
                      <span className="text-lg text-white/50">%</span>
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${v}%`,
                          background: THERMAL_GRADIENT,
                          boxShadow: "0 0 12px rgba(251,146,60,0.35)",
                        }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-white/50">Higher than ~{pct.toFixed(0)}% of reference group</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-white/70">{domainInsightLine(k, v)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Thermal column heatmap + bar chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cn(glassCardClassName("p-5"), "border-white/10 bg-white/[0.02]")}>
            <h3 className="font-heading mb-1 text-base font-semibold text-white/90">Intensity map</h3>
            <p className="mb-4 text-xs text-white/50">
              Columns: Self-Awareness → Social Skills · Vertical axis: intensity (0–100)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {EQ_DOMAIN_KEYS.map((k) => {
                const v = Math.min(100, result.domainScores[k] ?? 0);
                return (
                  <div key={k} className="flex flex-col items-center">
                    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10">
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, #1e3a8a 0%, #4f46e5 22%, #a855f7 48%, #ec4899 72%, #fb923c 100%)",
                        }}
                      />
                      <div className="absolute inset-0 bg-black/15" />
                      <div
                        className="absolute left-1/2 size-3.5 rounded-full border-2 border-amber-200 bg-white shadow-[0_0_16px_rgba(251,146,60,0.95)] motion-reduce:shadow-none"
                        style={{ bottom: `calc(${v}% - 6px)` }}
                        title={`${domainDisplayName(k)}: ${v.toFixed(0)}`}
                      />
                    </div>
                    <span className="mt-2 text-center text-[10px] leading-tight text-white/45">
                      {domainDisplayName(k).replace("Self-", "S.\u200b")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cn(glassCardClassName("p-5"), "border-white/10 bg-white/[0.02]")}>
            <h3 className="font-heading mb-1 text-base font-semibold text-white/90">Thermal bars</h3>
            <p className="mb-2 text-xs text-white/50">Score drives fill color (blue → purple → pink → amber)</p>
            <div className="h-[min(280px,40vh)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                  <XAxis
                    dataKey="short"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} width={32} />
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
                      typeof value === "number" ? `${value.toFixed(0)}%` : String(value ?? "—"),
                      "Score",
                    ]}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {barData.map((d) => (
                      <Cell key={d.key} fill={thermalHex(d.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Self-Awareness × Self-Regulation quadrant — thermal styling */}
        <div className={cn(glassCardClassName("p-5"), "border-white/10 bg-white/[0.02]")}>
          <h3 className="font-heading mb-1 text-base font-semibold text-white/90">Self-Awareness × Self-Regulation</h3>
          <p className="mb-4 text-xs text-white/50">Zone: {result.quadrantLabel}</p>
          <div className="relative mx-auto aspect-square w-full max-w-[280px]">
            <div
              className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-xl border border-white/10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,58,138,0.35) 0%, rgba(79,70,229,0.2) 33%, rgba(168,85,247,0.2) 66%, rgba(251,146,60,0.25) 100%)",
              }}
            >
              <div className="flex items-start justify-start border-r border-b border-white/10 p-2 text-[10px] text-white/55">
                Self-Reflective
              </div>
              <div className="flex items-start justify-end border-b border-white/10 p-2 text-[10px] text-white/55">
                Emotionally Balanced
              </div>
              <div className="flex items-end justify-start border-r border-white/10 p-2 text-[10px] text-white/55">
                Developing
              </div>
              <div className="flex items-end justify-end p-2 text-[10px] text-white/55">Action-Oriented</div>
            </div>
            <div
              className="absolute size-4 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_20px_rgba(251,146,60,0.85)] ring-2 ring-white/40 motion-reduce:shadow-md"
              style={{
                left: `calc(${x}% * 0.88 + 6%)`,
                bottom: `calc(${y}% * 0.88 + 6%)`,
              }}
              title="You"
            />
          </div>
          <p className="mt-3 text-center text-xs text-white/50">X = Self-Regulation · Y = Self-Awareness (0–100)</p>
        </div>

        {/* Emotional Blueprint */}
        <div>
          <h2 className="font-heading mb-4 text-xl font-semibold text-white/90">Your Emotional Blueprint</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div
              className={cn(
                glassCardClassName("p-4"),
                "border-amber-400/35 shadow-[0_0_24px_rgba(251,146,60,0.12)]",
              )}
            >
              <p className="text-caption-cerebral text-[10px] text-amber-200/80">Greatest strength</p>
              <p className="font-heading mt-1 text-lg font-semibold text-white/90">
                {domainDisplayName(result.highestDomain)}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Lead with this strength in conversations and decisions this month.
              </p>
            </div>
            <div className={cn(glassCardClassName("p-4"), "border-indigo-500/25 border-purple-500/20")}>
              <p className="text-caption-cerebral text-[10px] text-indigo-200/70">Growth opportunity</p>
              <p className="font-heading mt-1 text-lg font-semibold text-white/90">
                {domainDisplayName(result.lowestDomain)}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Small, repeated practice here compounds faster than chasing every domain at once.
              </p>
            </div>
            <div className={cn(glassCardClassName("p-4"), "border-white/10")}>
              <p className="text-caption-cerebral text-[10px] text-white/40">Balance profile</p>
              <p className="font-heading mt-1 text-lg font-semibold text-white/90">Spread · σ ≈ {variance.toFixed(1)}</p>
              <p className="mt-2 text-sm text-white/70">{balanceLabel}</p>
            </div>
          </div>
        </div>

        {result.consistencyFlags.length > 0 && (
          <div className={cn(glassCardClassName("border-amber-500/25 p-5"), "bg-amber-950/20")}>
            <h3 className="font-heading text-base font-semibold text-amber-100/90">Consistency check</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-white/75">
              {result.consistencyFlags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={cn(glassCardClassName("p-5"), "border-cyan-500/20 bg-cyan-950/10")}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <h3 className="font-heading text-base font-semibold text-white/90">AI coaching narrative</h3>
            <span className="ml-auto rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
              AI-enhanced
            </span>
          </div>
          <p className="leading-relaxed text-white/70">{result.narrativeText}</p>
        </div>

        {prev ? (
          <div className={cn(glassCardClassName("p-5"))}>
            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-semibold text-white/90">Growth over time</h3>
                <p className="text-sm text-white/50">
                  {prev.completedAt
                    ? `Previous completion: ${new Date(prev.completedAt).toLocaleDateString()}`
                    : "Previous attempt"}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCompare(!showCompare)}>
                <TrendingUp className="mr-1 size-4" />
                {showCompare ? "Hide" : "Compare"}
              </Button>
            </div>
            {showCompare ? (
              <div className="mt-4 space-y-2 text-sm text-white/75">
                <p>
                  Composite: {prev.compositeScore.toFixed(1)} → {result.compositeScore.toFixed(1)} (
                  {(result.compositeScore - prev.compositeScore).toFixed(1)} points)
                </p>
                <ul className="space-y-1 text-white/60">
                  {EQ_DOMAIN_KEYS.map((k) => {
                    const a = prev.domainScores[k] ?? 0;
                    const b = result.domainScores[k] ?? 0;
                    return (
                      <li key={k}>
                        {domainDisplayName(k)}: {a.toFixed(0)} → {b.toFixed(0)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn(glassCardClassName("p-5"), "border-amber-500/15")}>
          <h3 className="font-heading flex items-center gap-2 text-base font-semibold text-white/90">
            <Heart className="size-4 text-amber-400" />
            Development resources
          </h3>
          <p className="mt-1 text-sm text-white/50">Short tips — pick one habit to experiment with this month.</p>
          <div className="mt-4 space-y-3">
            {EQ_DOMAIN_KEYS.map((k) => {
              const r = EQ_DOMAIN_RESOURCES[k];
              return (
                <details
                  key={k}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-white/80"
                >
                  <summary className="cursor-pointer font-heading text-sm font-medium text-white/90">
                    {domainDisplayName(k)}
                  </summary>
                  <div className="mt-2 space-y-2 text-xs text-white/65">
                    <p>{r.summary}</p>
                    <p className="font-medium text-white/80">Books</p>
                    <ul className="list-inside list-disc">
                      {r.books.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <p className="font-medium text-white/80">Exercises</p>
                    <ul className="list-inside list-disc">
                      {r.exercises.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
