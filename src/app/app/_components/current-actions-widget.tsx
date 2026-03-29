"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Target, ChevronDown, Clock, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { completeMyUserAction, startMyUserAction } from "../actions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  competencyName: string;
  status: string;
};

export function CurrentActionsWidget({
  weekKey,
  items,
  completed,
  total,
}: {
  weekKey: string;
  items: Item[];
  completed: number;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = items.filter((i) => i.status !== "DISMISSED" && i.status !== "COMPLETED");
  const done = items.filter((i) => i.status === "COMPLETED");
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <Card className="border-border/60 overflow-hidden">
      <div
        className="flex cursor-pointer items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <Target className="size-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white/90">This week&apos;s focus</h3>
            <p className="text-sm text-white/50">
              {active.length} active · {done.length} completed · Week {weekKey.split("-W")[1] || weekKey}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-lg font-semibold text-white/80 tabular-nums">{progress}%</div>
          </div>
          <ChevronDown
            className={cn("size-5 text-white/50 transition-transform duration-200", expanded && "rotate-180")}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="border-t border-white/[0.06] pt-4">
              {active.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="size-6 text-emerald-400" />
                  </div>
                  <p className="mt-3 font-medium text-white/80">All caught up!</p>
                  <p className="text-sm text-white/50">Great job this week.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {active.slice(0, 4).map((item) => (
                    <ActionItemRow key={item.id} item={item} />
                  ))}
                  {active.length > 4 && (
                    <Link 
                      href="/app/actions"
                      className="flex items-center justify-center w-full py-2 text-sm text-white/60 hover:text-white/90 transition-colors mt-2"
                    >
                      View all {active.length} actions
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function ActionItemRow({ item }: { item: Item }) {
  const [status, setStatus] = useState(item.status);
  const [showComplete, setShowComplete] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAssigned = status === "ASSIGNED";
  const isInProgress = status === "IN_PROGRESS";

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "IN_PROGRESS") {
      setIsSubmitting(true);
      try {
        await startMyUserAction(item.id);
        setStatus(newStatus);
        toast.success("Marked as in progress");
      } catch (e) {
        toast.error("Failed to update");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleComplete() {
    if (!reflection.trim()) {
      toast.error("Please add a brief reflection");
      return;
    }
    setIsSubmitting(true);
    try {
      await completeMyUserAction(item.id, reflection);
      setStatus("COMPLETED");
      toast.success("Action completed!");
      setShowComplete(false);
    } catch (e) {
      toast.error("Failed to complete");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all",
        isInProgress
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-white/10 bg-white/[0.03] hover:border-white/15"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => !showComplete && setShowComplete(true)}
          disabled={isSubmitting}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-all",
            isInProgress
              ? "border-amber-400/60 bg-amber-400/20"
              : "border-white/20 hover:border-indigo-400/60"
          )}
        >
          {isInProgress && <div className="size-2 rounded-full bg-amber-400" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
            <Badge variant="secondary" className="text-[10px] font-normal">
              {item.competencyName}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {item.estimatedTime} min
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {isAssigned && (
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                disabled={isSubmitting}
                className="rounded bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/50 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
              >
                Mark In Progress
              </button>
            )}
            {isInProgress && (
              <span className="text-[10px] uppercase tracking-wider text-amber-400">
                In Progress
              </span>
            )}
            <button
              onClick={() => setShowComplete(!showComplete)}
              disabled={isSubmitting}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showComplete ? "Cancel" : "Complete"}
            </button>
          </div>

          <AnimatePresence>
            {showComplete && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-1 size-4 text-indigo-400/60" />
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What did you learn? How will you apply this? (Required)"
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">{reflection.length}/150</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowComplete(false)} disabled={isSubmitting} className="h-7 text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleComplete} disabled={isSubmitting || reflection.trim().length < 10} className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600">
                      {isSubmitting ? "Saving..." : "Complete"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
