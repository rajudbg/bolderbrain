"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { AIBadge } from "./ai-badge";

export type SmartAction = {
  title: string;
  description: string;
  resource: string;
};

export function AISmartActionCard({ action, index }: { action: SmartAction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-cyan-500/30"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
      </div>

      <div className="relative flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-sm font-semibold text-cyan-400">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="truncate font-medium text-white/90">{action.title}</h4>
            <AIBadge variant="insight" showTooltip={false} className="scale-95" />
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-white/60">{action.description}</p>
          <div className="flex items-center gap-2 text-xs text-cyan-400/80">
            <BookOpen className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{action.resource}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
