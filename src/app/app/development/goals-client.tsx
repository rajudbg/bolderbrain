"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createDevelopmentGoal, updateDevelopmentGoalStatus } from "./goal-actions";
import { toast } from "sonner";
import { GoalStatus } from "@/generated/prisma/enums";
import type { DevelopmentGoal, Competency } from "@/generated/prisma/client";
import { Check, CheckCircle2, Circle, Clock, Plus, Target, X } from "lucide-react";

type GoalWithCompetency = DevelopmentGoal & { competency: Competency | null };

export function GoalsClient({
  goals,
  competencies,
}: {
  goals: GoalWithCompetency[];
  competencies: Competency[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createDevelopmentGoal(formData);
        setIsAdding(false);
        toast.success("Goal created");
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  }

  function handleStatusChange(id: string, currentStatus: GoalStatus) {
    let nextStatus: GoalStatus = "IN_PROGRESS";
    if (currentStatus === "NOT_STARTED") nextStatus = "IN_PROGRESS";
    else if (currentStatus === "IN_PROGRESS") nextStatus = "COMPLETED";
    else nextStatus = "NOT_STARTED"; // allow reset

    startTransition(async () => {
      try {
        await updateDevelopmentGoalStatus(id, nextStatus);
        toast.success("Status updated");
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="size-4" />
            Development Goals & OKRs
          </CardTitle>
          <CardDescription>Track your personal objectives and manager-assigned goals.</CardDescription>
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 size-4" /> New Goal
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleAdd} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/70">Goal Title</label>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                placeholder="e.g. Improve conflict resolution skills"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/70">Linked Competency (Optional)</label>
                <select
                  name="competencyId"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  <option value="">None</option>
                  {competencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/70">Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white/70 focus:border-cyan-500/50 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                Save Goal
              </Button>
            </div>
          </form>
        )}

        {goals.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Target className="size-8 text-white/20" />
            <p className="text-sm text-white/60">No goals set yet. Add one to track your progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStatusChange(g.id, g.status)}
                    className="flex-shrink-0 text-white/40 hover:text-cyan-400 transition-colors"
                  >
                    {g.status === "COMPLETED" ? (
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    ) : g.status === "IN_PROGRESS" ? (
                      <Clock className="size-5 text-amber-400" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${g.status === "COMPLETED" ? "text-white/50 line-through" : "text-white/90"}`}>
                      {g.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {g.competency && (
                        <span className="text-white/50 rounded bg-white/5 px-1.5 py-0.5">
                          {g.competency.name}
                        </span>
                      )}
                      {g.targetDate && (
                        <span className="text-white/40">
                          Due {new Date(g.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
