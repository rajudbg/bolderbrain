"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TrainingDeltaPayload } from "@/lib/training-impact";
import { cn } from "@/lib/utils";

export function TrainingResultsClient({
  programName,
  delta,
  measurement = "likert_scale",
}: {
  programName: string;
  delta: TrainingDeltaPayload | null;
  /** Knowledge templates use % improvement; Likert / 360-style use absolute 1–5 point change. */
  measurement?: "knowledge_percent" | "likert_scale";
}) {
  if (!delta) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
        Results will appear after you complete your post-assessment.
      </p>
    );
  }

  const radar = delta.byCompetency.map((c) => ({
    competency: c.competencyKey.replace(/_/g, " "),
    pre: c.pre,
    post: c.post,
  }));

  const top3 = [...delta.byCompetency].sort((a, b) => b.delta - a.delta).slice(0, 3);

  return (
    <div className="space-y-8">
      <Link
        href="/app/training"
        className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/90"
      >
        <ArrowLeft className="size-4" />
        My learning
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold text-white/95 md:text-3xl">{programName}</h1>
        <p className="mt-2 text-sm text-white/50">Your measured growth from pre to post.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-orange-600/5 p-8 text-center shadow-[0_0_48px_rgba(245,158,11,0.15)]"
      >
        <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-amber-200/70">
          Overall movement
        </p>
        <p className="font-heading mt-3 text-5xl text-transparent bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text">
          {delta.overall.pre.toFixed(1)} → {delta.overall.post.toFixed(1)}
        </p>
        <p className="mt-2 flex flex-col items-center justify-center gap-1 text-lg font-semibold text-amber-100/95">
          <span className="flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-400/90" />
            {measurement === "knowledge_percent" ? (
              <>
                +{delta.overall.delta.toFixed(1)} percentage points{" "}
                <span className="text-base font-normal text-white/55">
                  ({delta.overall.pre.toFixed(0)}% → {delta.overall.post.toFixed(0)}%)
                </span>
              </>
            ) : (
              <>+{delta.overall.delta.toFixed(2)} pts on a 1–5 scale</>
            )}
          </span>
          {measurement === "knowledge_percent" && (
            <span className="text-sm font-normal text-white/45">{delta.overall.percentChange}% gain vs. your pre score</span>
          )}
        </p>
        {measurement === "likert_scale" && (
          <p className="mt-1 text-xs text-white/40">Average change on the scale (not a percent) — higher is stronger agreement.</p>
        )}
      </motion.div>

      {delta.byCompetency.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {delta.byCompetency.map((c, i) => (
            <motion.div
              key={c.competencyKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                "rounded-2xl border p-5 backdrop-blur-xl",
                impactBorder(c.impact),
              )}
            >
              <p className="text-caption-cerebral text-[10px] uppercase tracking-widest text-white/40">
                {c.competencyKey.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-lg font-semibold text-white/95">
                {c.pre.toFixed(1)} → {c.post.toFixed(1)}{" "}
                {measurement === "knowledge_percent" ? (
                  <span className="text-amber-200/90">(+{c.percentChange}%)</span>
                ) : (
                  <span className="text-amber-200/90">(+{c.delta.toFixed(2)} pts)</span>
                )}
              </p>
              <p className="mt-1 text-xs text-white/45">{c.impact}</p>
            </motion.div>
          ))}
        </div>
      )}

      {radar.length > 2 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-4 text-center text-sm font-medium text-white/70">Before / after profile</p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" fill="rgba(255,255,255,0.02)" />
                <PolarAngleAxis dataKey="competency" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: "rgba(255,255,255,0.35)" }} />
                <Radar name="Pre" dataKey="pre" stroke="rgba(148,163,184,0.6)" fill="transparent" strokeDasharray="4 4" />
                <Radar
                  name="Post"
                  dataKey="post"
                  stroke="rgba(251,191,36,0.9)"
                  fill="rgba(251,191,36,0.15)"
                />
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
          <p className="mt-2 text-center text-xs text-white/40">Dotted = pre · Filled = post</p>
        </div>
      )}

      {top3.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg text-white/90">Growth areas</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {top3.map((c) => (
              <li key={c.competencyKey}>
                <strong className="text-white/90">{c.competencyKey.replace(/_/g, " ")}</strong> — keep practicing
                behaviors that reinforce this skill in your next 1:1s.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function impactBorder(impact: string) {
  switch (impact) {
    case "TRANSFORMATIVE":
      return "border-amber-400/40 bg-amber-500/5 shadow-[0_0_28px_rgba(245,158,11,0.12)]";
    case "SIGNIFICANT":
      return "border-indigo-400/35 bg-indigo-500/5 shadow-[0_0_24px_rgba(99,102,241,0.12)]";
    case "DECLINED":
      return "border-red-400/25 bg-red-500/5";
    default:
      return "border-white/12 bg-white/[0.03]";
  }
}
