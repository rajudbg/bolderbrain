"use client";

import { useState } from "react";
import { MessageSquare, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIBadge, type AIBadgeVariant } from "./ai-badge";

function badgeVariantFromSource(source: string): AIBadgeVariant {
  if (source === "AI_NEMOTRON") return "insight";
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

  const isAiGenerated = source === "AI_NEMOTRON" || source === "CACHED";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-gradient-to-br from-[#0A0A0C] to-[#0F0F11]",
        "border backdrop-blur-xl",
        isAiGenerated ? "border-cyan-500/25" : "border-white/10",
      )}
    >
      <div className="ai-aurora-mesh pointer-events-none absolute inset-0 opacity-80" aria-hidden />

      {isAiGenerated && (
        <div
          className="ai-breathe pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />
      )}

      <div className="relative mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "rounded-lg p-1.5",
              isAiGenerated ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-white/60",
            )}
          >
            {isAiGenerated ? <Sparkles className="size-4" /> : <MessageSquare className="size-4" />}
          </div>
          <span className="text-sm font-medium text-white/90">Coach insight</span>
        </div>

        <AIBadge variant={badgeVariantFromSource(source)} className="shrink-0" />
      </div>

      <p className="relative mb-4 text-sm leading-relaxed text-white/80">{finalText}</p>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/40">Was this helpful?</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-8 text-white/45 hover:bg-cyan-500/10 hover:text-cyan-400", rating === 5 && "text-cyan-400")}
            disabled={pending}
            aria-label="Helpful"
            onClick={() => submit(5)}
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-8 text-white/45 hover:bg-rose-500/10 hover:text-rose-400", rating === 1 && "text-rose-400")}
            disabled={pending}
            aria-label="Not helpful"
            onClick={() => submit(1)}
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>

        {isAiGenerated && generationTimeMs != null && (
          <span className="font-data text-xs text-white/35">
            {generationTimeMs}ms · {modelShort}
          </span>
        )}
      </div>
    </motion.div>
  );
}
