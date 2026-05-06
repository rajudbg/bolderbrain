"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Copy, Check, RotateCcw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { generateMyDevPlan } from "./actions";
import { cn } from "@/lib/utils";

function renderPlanMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="mt-4 mb-2 first:mt-0 font-semibold text-white/90 text-sm">
          {line.replace(/\*\*/g, "")}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-cyan-400/60" />
          <span className="text-sm text-white/75 leading-relaxed">{line.slice(2)}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-sm text-white/75 leading-relaxed">
        {line}
      </p>
    );
  });
}

export function DevPlanClient() {
  const [planText, setPlanText] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      try {
        const result = await generateMyDevPlan();
        setPlanText(result.planText);
        setSource(result.source);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to generate plan");
      }
    });
  }

  function copyPlan() {
    if (!planText) return;
    navigator.clipboard.writeText(planText);
    setCopied(true);
    toast.success("Plan copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  const isAi = source === "AI_GENERATED" || source === "CACHED";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all duration-300",
        isAi && planText
          ? "border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-[#0F0F11] shadow-[0_0_40px_rgba(6,182,212,0.07)]"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex size-8 items-center justify-center rounded-xl transition-all",
            isAi && planText
              ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_16px_rgba(6,182,212,0.4)]"
              : "bg-white/[0.08]",
          )}>
            <Calendar className="size-4 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-white/90">90-Day Development Plan</h2>
            <p className="text-xs text-white/45">AI-generated from your assessment data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {planText && (
            <button
              type="button"
              onClick={copyPlan}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/60 transition-all hover:border-white/20 hover:text-white/80"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={pending}
            id="generate-dev-plan-btn"
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
              "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
              "hover:shadow-[0_0_24px_rgba(6,182,212,0.35)] active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : planText ? (
              <>
                <RotateCcw className="size-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
                <div className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Sparkles className="size-6 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">Building your personalised plan…</p>
                <p className="mt-1 text-xs text-white/40">Analysing 360, EQ, and personality data</p>
              </div>
              <div className="flex gap-1">
                {["Foundation", "Practice", "Mastery"].map((phase, i) => (
                  <span
                    key={phase}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[10px] text-cyan-400/70 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan content */}
      <AnimatePresence>
        {planText && !pending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            {isAi && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                <p className="text-xs text-cyan-300/80">
                  AI-generated from your skills gaps, EQ profile, and personality data. Edit and own it.
                </p>
              </div>
            )}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              {renderPlanMarkdown(planText)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!planText && !pending && (
        <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Calendar className="size-6 text-white/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">No plan yet</p>
            <p className="mt-1 text-xs text-white/35">
              Generate a personalised 90-day plan based on your 360 feedback, EQ results, and personality profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
