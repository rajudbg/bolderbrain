"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getStatusConfig, getSourceLabel, getDifficultyConfig, getSeverityConfig } from "@/lib/ui-labels";
import type { LucideIcon } from "lucide-react";

type StatusBadgeProps = {
  status: string;
  showIcon?: boolean;
  className?: string;
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5",
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      {config.label}
    </Badge>
  );
}

type SourceBadgeProps = {
  source: string;
  showIcon?: boolean;
  className?: string;
};

export function SourceBadge({ source, showIcon = true, className }: SourceBadgeProps) {
  const config = getSourceLabel(source);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      {config.label}
    </span>
  );
}

type DifficultyBadgeProps = {
  difficulty: string;
  showIcon?: boolean;
  className?: string;
};

export function DifficultyBadge({ difficulty, showIcon = true, className }: DifficultyBadgeProps) {
  const config = getDifficultyConfig(difficulty);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5",
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      {config.label}
    </Badge>
  );
}

type SeverityIndicatorProps = {
  severity: string;
  showLabel?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function SeverityIndicator({
  severity,
  showLabel = true,
  showIcon = true,
  size = "md",
  className,
}: SeverityIndicatorProps) {
  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-6 text-xs",
    md: "h-8 text-sm",
    lg: "h-10 text-base",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 rounded px-2 font-medium",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && config.label}
    </div>
  );
}

// Generic icon-text pair for consistent styling
type IconTextProps = {
  icon: LucideIcon;
  text: string;
  className?: string;
  iconClassName?: string;
};

export function IconText({ icon: Icon, text, className, iconClassName }: IconTextProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn("size-4 shrink-0", iconClassName)} />
      {text}
    </span>
  );
}
