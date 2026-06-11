"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Crown,
  ArrowRight,
  Sparkles,
  BarChart3,
  Workflow,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureStatus = "deep" | "basic" | "none";

interface Competitor {
  name: string;
  short: string;
  isBolderBrain: boolean;
}

interface FeatureRow {
  feature: string;
  description: string;
  isBolderBrainOnly: boolean;
  statuses: FeatureStatus[];
}

const competitors: Competitor[] = [
  { name: "BolderBrain", short: "BB", isBolderBrain: true },
  { name: "Mercer | Mettl", short: "Mettl", isBolderBrain: false },
  { name: "SHL", short: "SHL", isBolderBrain: false },
  { name: "Jombay", short: "Jombay", isBolderBrain: false },
  { name: "Disprz", short: "Disprz", isBolderBrain: false },
  { name: "Darwinbox", short: "Darwinbox", isBolderBrain: false },
  { name: "Lattice", short: "Lattice", isBolderBrain: false },
];

const features: FeatureRow[] = [
  { feature: "360° Multi-Rater Feedback", description: "Self, peer, and manager assessments with configurable templates", isBolderBrainOnly: false, statuses: ["deep", "deep", "deep", "deep", "none", "deep", "deep"] },
  { feature: "IQ / Cognitive Testing", description: "Numerical, verbal, spatial, and logical reasoning", isBolderBrainOnly: false, statuses: ["deep", "deep", "deep", "none", "none", "none", "none"] },
  { feature: "EQ (Goleman-based) Testing", description: "Emotional intelligence across 5 domains", isBolderBrainOnly: false, statuses: ["deep", "deep", "none", "deep", "none", "none", "none"] },
  { feature: "Psychometric (Big Five/OCEAN)", description: "Full personality profiling with validity checks", isBolderBrainOnly: false, statuses: ["deep", "deep", "deep", "deep", "none", "none", "none"] },
  { feature: "TNA / Training Needs Analysis", description: "Gap-driven training identification and planning", isBolderBrainOnly: false, statuses: ["deep", "deep", "deep", "none", "deep", "none", "none"] },
  { feature: "Pre/Post Training Impact", description: "Measure training ROI with paired assessments", isBolderBrainOnly: true, statuses: ["deep", "none", "deep", "none", "none", "none", "none"] },
  { feature: "AI Coaching & Insights", description: "Personalized AI-generated development narratives", isBolderBrainOnly: false, statuses: ["deep", "none", "none", "none", "deep", "none", "deep"] },
  { feature: "Automated Action Engine", description: "Post-assessment dev plan with streak tracking", isBolderBrainOnly: false, statuses: ["deep", "none", "none", "deep", "deep", "deep", "none"] },
  { feature: "9-Box Talent Grid (Auto-Suggest)", description: "Evidence-based talent mapping from assessment data", isBolderBrainOnly: false, statuses: ["deep", "none", "none", "none", "none", "deep", "none"] },
  { feature: "Skills Inventory Heatmap", description: "Real-time competency gap visualization", isBolderBrainOnly: false, statuses: ["deep", "none", "deep", "none", "deep", "none", "none"] },
  { feature: "Single Integrated Data Model", description: "One platform connecting all assessment data", isBolderBrainOnly: true, statuses: ["deep", "none", "none", "none", "none", "none", "none"] },
];

function StatusIcon({ status }: { status: FeatureStatus }) {
  if (status === "deep") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      </span>
    );
  }
  if (status === "basic") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
        <span className="text-[10px] font-bold text-amber-400">~</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center">
      <X className="h-3.5 w-3.5 text-white/20" />
    </span>
  );
}

function BolderBrainBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-600/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
      <Crown className="h-3 w-3" />
      Unmatched
    </span>
  );
}

export default function ComparisonPage() {
  const stagger = 0.03;

  return (
    <div className="relative pt-32 pb-24">
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            <span>No other platform comes close</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The only platform that does it all
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
            Every competitor specializes in one piece of the puzzle. BolderBrain is the only platform
            that connects the full assessment-to-development lifecycle in a single integrated system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/marketing/demo"
              className="btn-primary px-8 py-4 text-lg"
            >
              See It in Action
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/marketing/features"
              className="btn-secondary px-8 py-4 text-lg"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Comparison Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3">
            Full feature comparison
          </h2>
          <p className="text-white/60">
            BolderBrain is the only platform with deep coverage across{" "}
            <span className="text-white font-medium">all 11 categories</span>.
          </p>
        </motion.div>

        {/* Table Wrapper - Horizontal scroll on mobile */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px]">
            {/* Header */}
            <thead>
              <tr className="border-b border-white/10">
                <th className="sticky left-0 z-10 bg-[#0A0A0A] p-4 text-left" style={{ minWidth: 200 }}>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Feature</span>
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.short}
                    className={cn(
                      "p-4 text-center text-sm font-semibold",
                      c.isBolderBrain ? "bg-indigo-500/10 text-indigo-300" : "text-white/60"
                    )}
                    style={{ minWidth: 100 }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {c.isBolderBrain && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">You</span>
                      )}
                      <span className={cn(c.isBolderBrain && "text-white")}>{c.short}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {/* Body */}
            <tbody>
              {features.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * stagger }}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
                    row.isBolderBrainOnly && "bg-gradient-to-r from-amber-500/5 to-transparent"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-[#0A0A0A] p-4" style={{ minWidth: 200 }}>
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{row.feature}</span>
                          {row.isBolderBrainOnly && <BolderBrainBadge />}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{row.description}</p>
                      </div>
                    </div>
                  </td>
                  {row.statuses.map((status, j) => (
                    <td
                      key={j}
                      className={cn(
                        "p-4 text-center",
                        competitors[j].isBolderBrain && "bg-indigo-500/[0.03]"
                      )}
                    >
                      <div className="flex justify-center">
                        <StatusIcon status={status} />
                      </div>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-white/40">
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-3 w-3 text-emerald-400" />
            </span>
            Deep coverage
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15">
              <span className="text-[9px] font-bold text-amber-400">~</span>
            </span>
            Basic / limited
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center">
              <X className="h-3 w-3 text-white/20" />
            </span>
            Not available
          </span>
          <span className="flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            Unmatched — no competitor offers this
          </span>
        </div>
      </div>

      {/* What This Means */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              What this means for your team
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              One platform replaces multiple vendors. One data model connects every insight.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Workflow,
                title: "From Assessment to Action",
                description: "A 360 feedback completion automatically generates a personalized development plan with streak-tracked weekly actions. No other platform closes this loop.",
                highlight: "360 → Actions → Streaks in one workflow",
              },
              {
                icon: BarChart3,
                title: "Training ROI You Can Measure",
                description: "Pre-assessment → training → post-assessment → skills heatmap → 9-box impact. Every training investment has measurable outcomes tied to real competency data.",
                highlight: "The only platform with pre/post impact tracking",
                isUnmatched: true,
              },
              {
                icon: Shield,
                title: "AI That Never Fails",
                description: "Every AI feature has a complete non-AI fallback. If the LLM is down, your insights still work. Most competitors break when their AI provider has an outage.",
                highlight: "100% uptime for all insight features",
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium group p-8 flex flex-col"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-5">
                  <benefit.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed flex-1">{benefit.description}</p>
                <div className="mt-5 flex items-center gap-2 text-xs font-medium">
                  {benefit.isUnmatched ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-400">
                      <Crown className="h-3 w-3" />
                      {benefit.highlight}
                    </span>
                  ) : (
                    <span className="text-indigo-400">{benefit.highlight}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms We Replace */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              One platform. Endless possibilities.
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Stop juggling multiple vendors. BolderBrain replaces:
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Separate 360 tool",
                "Psychometric vendor",
                "Cognitive testing platform",
                "EQ assessment tool",
                "TNA spreadsheet",
                "Training impact tracker",
                "Competency management",
                "Talent grid matrix",
                "AI coaching add-on",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-center"
                >
                  <span className="text-sm text-white/60 line-through">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <span className="text-lg font-semibold text-white">
                  Replaced by BolderBrain
                </span>
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-white/60">
                One login. One data model. One price. No integrations to maintain.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl text-center overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to consolidate your stack?
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
                Join the organizations that have replaced multiple tools with one platform.
              </p>
              <Link
                href="/marketing/demo"
                className="btn-primary px-8 py-4 text-lg"
              >
                Schedule Your Demo
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
