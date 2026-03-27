import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const href = "/admin/feedback-360/new";

/** Primary HR action — Launch a new 360 feedback cycle. */
export function Launch360ReviewButton({ className }: { className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-black shadow-lg shadow-amber-500/25 transition-all",
        "hover:scale-105 hover:shadow-lg hover:shadow-amber-500/40",
        "focus-visible:ring-purple-500/50 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F11]",
        className,
      )}
    >
      <Plus className="size-5 shrink-0" aria-hidden />
      Launch 360 Review
    </Link>
  );
}
