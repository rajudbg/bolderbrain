import Link from "next/link";
import { ArrowRight, LayoutDashboard, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResultsCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0F0F11]/80 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:left-72">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row px-4 lg:px-8">
        <div>
          <h4 className="font-heading text-sm font-semibold text-white/90">What&apos;s next?</h4>
          <p className="text-xs text-white/50">Keep the momentum going by checking your development plan.</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Link href="/app/dashboard" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full border-white/10 bg-white/[0.02]">
              <LayoutDashboard className="mr-2 size-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/app/development" className="flex-1 sm:flex-none">
            <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-600">
              <Target className="mr-2 size-4" />
              Development Plan
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
