"use client";

import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import type { GeneratedInsight } from "@/lib/insights/types";
import { cn } from "@/lib/utils";

function iconFor(kind: GeneratedInsight["kind"]) {
  switch (kind) {
    case "blind_spot":
      return AlertTriangle;
    case "hidden_strength":
      return Sparkles;
    case "development":
      return Lightbulb;
    default:
      return Lightbulb;
  }
}

function stylesFor(severity: GeneratedInsight["severity"]) {
  switch (severity) {
    case "WARNING":
      return {
        border: "border-amber-400/30",
        bg: "bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent backdrop-blur-xl",
        icon: "text-amber-300",
        glow: "shadow-[0_0_28px_rgba(245,158,11,0.25)]",
      };
    case "POSITIVE":
      return {
        border: "border-emerald-400/25",
        bg: "bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent backdrop-blur-xl",
        icon: "text-emerald-300",
        glow: "shadow-[0_0_24px_rgba(16,185,129,0.2)]",
      };
    default:
      return {
        border: "border-indigo-400/25",
        bg: "bg-gradient-to-br from-indigo-500/10 via-white/[0.02] to-transparent backdrop-blur-xl",
        icon: "text-indigo-300",
        glow: "shadow-[0_0_24px_rgba(99,102,241,0.3)]",
      };
  }
}

export function InsightCards({ insights }: { insights: GeneratedInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => {
        const Icon = iconFor(insight.kind);
        const s = stylesFor(insight.severity);
        return (
          <div
            key={insight.id}
            className={cn(
              "rounded-2xl border p-5 transition-all duration-500 ease-out",
              s.border,
              s.bg,
              s.glow,
              "hover:border-white/20",
            )}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className={cn("rounded-xl border border-white/10 bg-white/[0.06] p-2", s.icon)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-caption-cerebral mb-1">{insight.title}</p>
                <p className="text-sm leading-relaxed text-white/80">{insight.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
