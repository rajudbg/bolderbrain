import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-base shadow-inner shadow-black/20 outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-purple-500/40 focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F11] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
