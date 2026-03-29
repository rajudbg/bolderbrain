import { redirect } from "next/navigation";
import Link from "next/link";
import { Lightbulb, TrendingUp, Target, Clock, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getRecommendationsForUser } from "@/lib/recommendations";

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

function typeLabel(type: string) {
  switch (type) {
    case "competency_gap":
      return "Gap to Close";
    case "development_area":
      return "Development Area";
    default:
      return "Skill Building";
  }
}

export default async function RecommendationsPage() {
  const data = await getRecommendationsForUser();
  if (!data) redirect("/login");

  const { byCategory, totalRecommendations, highPriorityCount } = data;
  const allRecs = [
    ...byCategory.competencyGaps,
    ...byCategory.developmentAreas,
    ...byCategory.skillBuilding,
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
        <p className="text-caption-cerebral">Development</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight">
          Recommended for You
        </h1>
        <p className="text-body-cerebral max-w-2xl">
          Personalized development suggestions based on your assessment results and competency gaps.
          {highPriorityCount > 0 && (
            <span className="text-rose-400 ml-1">
              {highPriorityCount} high priority {highPriorityCount === 1 ? "item" : "items"} need attention.
            </span>
          )}
        </p>
      </header>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total Recommendations</CardDescription>
            <CardTitle className="text-3xl">{totalRecommendations}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Competency Gaps</CardDescription>
            <CardTitle className="text-3xl">{byCategory.competencyGaps.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Development Areas</CardDescription>
            <CardTitle className="text-3xl">
              {byCategory.developmentAreas.length + byCategory.skillBuilding.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      {/* All Recommendations */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">All Recommendations</h2>
        
        {allRecs.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto size-8 text-white/30" />
              <p className="mt-3 text-white/60">
                Complete a 360 assessment to get personalized recommendations
              </p>
              <Link 
                href="/assessments"
                className="inline-flex items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors mt-4"
              >
                Take Assessment
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allRecs.map((rec) => {
              const Icon = typeIcon(rec.type);
              return (
                <Card key={rec.id} className="border-border/60 hover:border-white/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-lg bg-white/[0.06] p-2.5">
                        <Icon className="size-5 text-indigo-400" />
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
                          <Badge variant="secondary" className="text-[10px]">
                            {typeLabel(rec.type)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-white/60">{rec.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {rec.estimatedTimeMinutes} min
                          </span>
                          {rec.competencyName && (
                            <span className="text-indigo-300/70">{rec.competencyName}</span>
                          )}
                          {rec.matchedGap !== null && (
                            <span className="text-amber-300/70">
                              Gap: {(rec.matchedGap > 0 ? "+" : "") + rec.matchedGap.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={rec.actionId ? "/app/actions" : "/app/training"}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        {rec.actionId ? "View Action" : "Start Learning"}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* How This Works */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">How recommendations work</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 size-4 text-indigo-400" />
            <span>
              <strong className="text-white/80">Competency Gaps:</strong> Detected when your self-rating is higher than how others perceive you. Close the gap by practicing observable behaviors.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Target className="mt-0.5 size-4 text-indigo-400" />
            <span>
              <strong className="text-white/80">Development Areas:</strong> Low-scoring competencies where others rated you below average. Focus on building these skills over time.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 text-indigo-400" />
            <span>
              <strong className="text-white/80">Skill Building:</strong> General development resources to expand your capabilities beyond current gaps.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
