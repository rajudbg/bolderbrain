import { Database, Loader2, Shield, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIBadgeVariant = "insight" | "generating" | "fallback" | "cached";

type BadgeConfig = {
  icon: LucideIcon;
  text: string;
  gradient: string;
  glow: string;
  iconClass?: string;
  tooltip: string;
};

const configs: Record<AIBadgeVariant, BadgeConfig> = {
  insight: {
    icon: Sparkles,
    text: "AI-Enhanced",
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-[0_0_28px_rgba(6,182,212,0.2)]",
    tooltip: "Personalized by Nemotron AI",
  },
  generating: {
    icon: Loader2,
    text: "Generating…",
    gradient: "from-cyan-400 to-teal-500",
    glow: "shadow-[0_0_24px_rgba(34,211,238,0.25)]",
    iconClass: "animate-spin",
    tooltip: "Crafting your personalized insight",
  },
  fallback: {
    icon: Shield,
    text: "Standard",
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-[0_0_12px_rgba(148,163,184,0.12)]",
    tooltip: "Rule-based insight (AI unavailable)",
  },
  cached: {
    icon: Database,
    text: "AI-Enhanced",
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-[0_0_28px_rgba(6,182,212,0.2)]",
    tooltip: "Personalized insight (cached)",
  },
};

export function AIBadge({
  variant,
  showTooltip = true,
  className,
}: {
  variant: AIBadgeVariant;
  showTooltip?: boolean;
  className?: string;
}) {
  const config = configs[variant];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm",
        "bg-gradient-to-r",
        config.gradient,
        config.glow,
        className,
      )}
      title={showTooltip ? config.tooltip : undefined}
    >
      <Icon className={cn("size-3.5 shrink-0", config.iconClass)} aria-hidden />
      {config.text}
    </span>
  );
}
