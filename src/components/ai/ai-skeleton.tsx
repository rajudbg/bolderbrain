import { cn } from "@/lib/utils";

export function AISkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#0A0A0C] p-4">
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-40">
        <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl motion-safe:animate-pulse" />
      </div>

      <div className="relative mb-4 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-2 animate-ping rounded-full bg-cyan-400 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
        </span>
        <span className="text-sm font-medium text-cyan-300/90">Crafting your insight…</span>
      </div>

      <div className="relative space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 rounded animate-ai-shimmer",
              "motion-reduce:!animate-none motion-reduce:!bg-white/[0.06]",
            )}
            style={{
              width: `${Math.max(45, 85 - i * 12)}%`,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
