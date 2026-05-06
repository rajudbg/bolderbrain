import Link from "next/link";
import { redirect } from "next/navigation";
import { getDevelopmentHubPayload } from "./actions";
import { DevelopmentRadarChart } from "./development-radar-chart";
import { SelfIdentifyForm } from "./self-identify-form";
import { DevPlanClient } from "./dev-plan-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DevelopmentHubPage() {
  const data = await getDevelopmentHubPayload();
  if (!data) redirect("/login?callbackUrl=/app/development");

  const radarRows = data.inventory.map((row) => ({
    competency: row.competency.name.length > 18 ? `${row.competency.name.slice(0, 16)}…` : row.competency.name,
    Current: Math.round(row.currentScore * 100) / 100,
    Target: Math.round(row.targetScore * 100) / 100,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Career &amp; development</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight md:text-4xl">Your skills hub</h1>
        <p className="text-body-cerebral max-w-2xl">
          {data.organizationName} — compare your proficiency to role targets, log development needs, and track assigned
          learning.
        </p>
      </header>

      {/* AI 90-Day Development Plan */}
      <DevPlanClient />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Skills vs targets</CardTitle>
          <CardDescription>Radar view of current scores vs organizational targets (from your latest snapshots).</CardDescription>
        </CardHeader>
        <CardContent className="h-[380px] w-full">
          <DevelopmentRadarChart data={radarRows} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SelfIdentifyForm competencies={data.competencies} />
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Your training needs</CardTitle>
            <CardDescription>From TNA, your manager, or self-nomination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.needs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open needs. You&apos;re all set.</p>
            ) : (
              <ul className="space-y-3">
                {data.needs.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-white/90">{n.competency.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          n.source === "SELF_IDENTIFIED"
                            ? "border-amber-500/40 text-amber-200"
                            : "border-white/20 text-white/70"
                        }
                      >
                        {n.source.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/45">
                      Gap {n.gap.toFixed(2)} · {n.status.replace(/_/g, " ")}
                      {n.assignedProgram ? ` · ${n.assignedProgram.name}` : ""}
                    </p>
                    {n.notes && <p className="text-xs text-white/55">{n.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/app/training" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
              Open my learning →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
