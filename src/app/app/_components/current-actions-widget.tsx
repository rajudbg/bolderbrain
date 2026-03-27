"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { completeMyUserAction } from "../actions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const active = items.filter((i) => i.status !== "DISMISSED");
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const circumference = 2 * Math.PI * 36;
  const dash = (pct / 100) * circumference;

  async function onComplete(id: string) {
    try {
      await completeMyUserAction(id);
      toast.success("Marked complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">This week&apos;s focus</CardTitle>
          <CardDescription>
            Week {weekKey} · {total === 0 ? "No actions scheduled" : `${completed} of ${total} done`}
          </CardDescription>
        </div>
        <div className="relative size-24 shrink-0">
          <svg className="-rotate-90 size-24" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" className="stroke-muted" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              className="stroke-primary transition-all duration-500"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
            {total === 0 ? "—" : `${completed}/${total}`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.length === 0 ? (
          <div className="bg-muted/40 rounded-2xl border border-dashed px-6 py-10 text-center">
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground mt-1 text-sm">Great job — nothing due this week.</p>
            <Link href="/app/actions" className={cn(buttonVariants({ variant: "link" }), "mt-4 inline-block")}>
              View history
            </Link>
          </div>
        ) : (
          <>
            {active.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="bg-muted/30 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 text-[10px]">
                    {a.competencyName}
                  </Badge>
                  <p className="font-medium leading-snug">{a.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{a.description}</p>
                </div>
                {a.status === "COMPLETED" ? (
                  <span className="text-primary flex items-center gap-1 text-sm font-medium">
                    <CheckCircle2 className="size-4" /> Done
                  </span>
                ) : (
                  <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => onComplete(a.id)}>
                    <Circle className="size-4" />
                    Complete
                  </Button>
                )}
              </div>
            ))}
            <Link href="/app/actions" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}>
              Open My actions
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
