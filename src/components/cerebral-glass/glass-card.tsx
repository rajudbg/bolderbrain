import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/** Glass panel surface — use instead of raw Card when you need the full Cerebral treatment. */
export function glassCardClassName(className?: string) {
  return cn(
    "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent",
    "shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 ease-out",
    "hover:border-white/20 hover:shadow-2xl hover:from-white/[0.09]",
    className,
  );
}

export function GlassCard({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={glassCardClassName(className)} {...props} />;
}
