"use client";

import Link from "next/link";
import { Lightbulb, TrendingUp, Target, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrainingRecommendation } from "@/lib/recommendations";

function priorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "competency_gap":
      return TrendingUp;
    case "development_area":
      return Target;
    default:
      return Lightbulb;
  }
}

export function RecommendationsWidget({
  recommendations,
  highPriorityCount,
}: {
  recommendations: TrainingRecommendation[];
  highPriorityCount: number;
}) {
  if (recommendations.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Recommended for you</CardTitle>
          <CardDescription>Personalized development suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <Lightbulb className="mx-auto size-8 text-white/30" />
            <p className="mt-3 text-sm text-white/60">
              Complete a 360 assessment to get personalized recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topRecs = recommendations.slice(0, 3);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Recommended for you</CardTitle>
          <CardDescription>
            {highPriorityCount > 0 ? (
              <span className="text-rose-400">{highPriorityCount} high priority items</span>
            ) : (
              "Personalized development suggestions"
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topRecs.map((rec) => {
          const Icon = typeIcon(rec.type);
          return (
            <div
              key={rec.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white/[0.06] p-2">
                  <Icon className="size-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white/90">{rec.title}</h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider ${priorityColor(rec.priority)}`}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/60 line-clamp-2">
                    {rec.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {rec.estimatedTimeMinutes} min
                    </span>
                    {rec.competencyName && (
                      <span className="text-indigo-300/70">{rec.competencyName}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={rec.actionId ? `/app/actions` : `/app/training`}
                  className="shrink-0 flex items-center justify-center rounded-md p-2 text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {recommendations.length > 3 && (
          <Link
            href="/app/recommendations"
            className="flex items-center justify-center w-full py-2 text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            View all {recommendations.length} recommendations
            <ArrowRight className="ml-1 size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
