"use client";

import Link from "next/link";
import type { DashboardAssessmentRow } from "@/lib/employee-dashboard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function statusVariant(
  l: DashboardAssessmentRow["statusLabel"],
): "default" | "secondary" | "outline" {
  if (l === "Completed") return "default";
  if (l === "In progress") return "secondary";
  return "outline";
}

export function RecentAssessmentsWidget({ rows }: { rows: DashboardAssessmentRow[] }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent 360 activity</CardTitle>
        <CardDescription>Completed and in-progress feedback cycles.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No assessments yet.</p>
        ) : (
          rows.map((r) => (
            <div
              key={`${r.role}-${r.id}`}
              className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-border hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-muted-foreground text-xs">
                  {r.orgName} · {r.role === "subject" ? "You are the subject" : "You are a rater"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(r.statusLabel)}>{r.statusLabel}</Badge>
                {r.resultUrl ? (
                  <Link href={r.resultUrl} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                    Results
                  </Link>
                ) : null}
                {r.takeUrl && r.statusLabel !== "Completed" ? (
                  <Link href={r.takeUrl} className={cn(buttonVariants({ size: "sm" }))}>
                    Continue
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
