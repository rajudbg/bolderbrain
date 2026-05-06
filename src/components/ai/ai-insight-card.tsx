"use client";

import { useState } from "react";
import { MessageSquare, Sparkles, ThumbsDown, ThumbsUp, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AIBadge, type AIBadgeVariant } from "./ai-badge";

/* ── Inline markdown renderer (no dependency needed) ── */
function renderMarkdown(text: string): React.ReactNode[] {
  // Split by line breaks, process each line
  return text.split("\n").map((line, lineIdx) => {
    // Bold: **text** or __text__
    const formatted: React.ReactNode[] = [];
    const parts = line.split(/\*\*(.+?)\*\*|__(.+?)__/g);
    let keyOffset = 0;
    for (const part of parts) {
      if (part === undefined) { keyOffset++; continue; }
      if (!part) { keyOffset++; continue; }
      // Check if this is a bold-captured group (odd index means captured by **)
      const isBold = parts.indexOf(part) % 2 === 1 && part.length > 0 && (line.includes("**" + part + "**") || line.includes("__" + part + "__"));
      if (isBold || (parts.filter(Boolean).indexOf(part) % 2 === 1)) {
        formatted.push(<strong key={`${lineIdx}-${keyOffset}`} className="font-semibold text-white">{part}</strong>);
      } else {
        formatted.push(<span key={`${lineIdx}-${keyOffset}`}>{part}</span>);
      }
      keyOffset++;
    }

    // Bullet point: "- " or "* "
    if (line.match(/^[-*]\s/)) {
      return (
        <div key={lineIdx} className="ml-4 flex items-start gap-2">
          <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-cyan-400/60" />
          <span className="-ml-2">{formatted}</span>
        </div>
      );
    }

    // Block quote: "> "
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={lineIdx}
          className="my-2 border-l-2 border-cyan-500/40 bg-cyan-500/[0.04] pl-3 py-2 pr-2 rounded-r-lg italic text-white/70"
        >
          <Quote className="mb-1 size-3 text-cyan-500/50" />
          {formatted}
        </blockquote>
      );
    }

    // Empty line: spacer
    if (line.trim() === "") return <div key={lineIdx} className="h-2" />;

    // Regular text
    return <p key={lineIdx} className="text-sm leading-relaxed">{formatted.length > 0 ? formatted : line}</p>;
  });
}

function badgeVariantFromSource(source: string): AIBadgeVariant {
  if (source === "AI_GENERATED" || source === "AI_NEMOTRON") return "insight";
  if (source === "CACHED") return "cached";
  return "fallback";
}

export function AIInsightCard({
  id,
  finalText,
  source,
  initialRating,
  generationTimeMs,
  modelUsed,
}: {
  id: string;
  finalText: string;
  source: string;
  initialRating: number | null;
  generationTimeMs?: number | null;
  modelUsed?: string | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isAiGenerated = source === "AI_GENERATED" || source === "AI_NEMOTRON" || source === "CACHED";

  async function submit(next: number) {
    setPending(true);
    try {
      const res = await fetch(`/api/app/ai-insights/${id}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: next }),
      });
      if (!res.ok) throw new Error("Failed");
      setRating(next);
      toast.success("Thanks for your feedback.");
    } catch {
      toast.error("Could not save feedback.");
    } finally {
      setPending(false);
    }
  }

  const modelShort = modelUsed?.includes("/") ? modelUsed.split("/").slice(1).join("/") : modelUsed ?? "AI";

  // Truncate long insights for a "read more" experience
  const needsTruncation = finalText.length > 200 && !expanded;
  const displayText = needsTruncation ? finalText.slice(0, 200) + "…" : finalText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-[#0A0A0C] to-[#0F0F11]",
        "border backdrop-blur-xl transition-all duration-300",
        isAiGenerated
          ? "border-cyan-500/20 shadow-[0_0_32px_rgba(6,182,212,0.08)] hover:border-cyan-400/30 hover:shadow-[0_0_48px_rgba(6,182,212,0.12)]"
          : "border-white/10 hover:border-white/15",
      )}
    >
      {/* Aurora glow */}
      <div className={cn(
        "ai-aurora-mesh pointer-events-none absolute inset-0 transition-opacity duration-500",
        isAiGenerated ? "opacity-80" : "opacity-30",
      )} aria-hidden />

      {isAiGenerated && (
        <div
          className="ai-breathe pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "rounded-lg p-1.5 transition-colors group-hover:bg-cyan-500/15",
                isAiGenerated ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-white/60",
              )}
            >
              {isAiGenerated ? <Sparkles className="size-4" /> : <MessageSquare className="size-4" />}
            </div>
            <span className="text-sm font-medium text-white/90">Coach insight</span>
          </div>

          <AIBadge variant={badgeVariantFromSource(source)} className="shrink-0" />
        </div>

        {/* Insight text with markdown rendering */}
        <div className="relative mb-4 space-y-0.5 text-white/85">
          {renderMarkdown(displayText)}
        </div>

        {/* Read more toggle */}
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mb-2 text-xs font-medium text-cyan-400/80 hover:text-cyan-300 transition-colors"
          >
            Read full insight ↓
          </button>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40">Was this helpful?</span>
            <button
              type="button"
              className={cn(
                "-ml-0.5 flex size-8 items-center justify-center rounded-lg transition-all",
                "hover:bg-cyan-500/10 hover:text-cyan-400",
                rating === 5 && "bg-cyan-500/15 text-cyan-400",
              )}
              disabled={pending}
              aria-label="Helpful"
              onClick={() => submit(5)}
            >
              <ThumbsUp className="size-4" />
            </button>
            <button
              type="button"
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-all",
                "hover:bg-rose-500/10 hover:text-rose-400",
                rating === 1 && "bg-rose-500/15 text-rose-400",
              )}
              disabled={pending}
              aria-label="Not helpful"
              onClick={() => submit(1)}
            >
              <ThumbsDown className="size-4" />
            </button>
          </div>

          {isAiGenerated && generationTimeMs != null && (
            <span className="font-data text-[10px] text-white/30 tracking-wide">
              {generationTimeMs}ms · {modelShort}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}