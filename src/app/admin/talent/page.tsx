import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTalentLists, getTeamPsychSummary, getPeopleDirectory } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { generateTeamDynamicsNarrative } from "@/lib/ai/eq-psych-narratives";
import { OceanRadarChart } from "./ocean-radar-chart";
import { getTalentGridPlacements } from "@/lib/nine-box";
import { NineBoxGrid } from "./nine-box-grid";

export default async function TalentInsightsPage() {
  const orgId = await requireAdminOrganizationId();
  const [{ highRisk, highPotential }, psychTeams, gridPlacements, people] = await Promise.all([
    getTalentLists(orgId),
    getTeamPsychSummary(orgId),
    getTalentGridPlacements(orgId),
    getPeopleDirectory(orgId)
  ]);

  // Generate AI team dynamics narratives in parallel
  const teamsWithAiNarratives = await Promise.all(
    psychTeams.map(async (t) => {
      const result = await generateTeamDynamicsNarrative(t)
        .then((text) => ({ narrativeText: text, aiSource: "AI_GENERATED" }))
        .catch(() => {
          const tip =
            t.avgConscientiousness >= 55 && t.avgExtraversion < 45
              ? "This group skews conscientious and quieter — consider a facilitator for open brainstorming."
              : t.avgExtraversion >= 55 && t.avgAgreeableness >= 55
                ? "High energy and agreeable — set clear decision roles to avoid endless consensus."
                : "Review trait spread with the team when planning collaboration norms.";
          return { narrativeText: tip, aiSource: "RULE_BASED" };
        });
      return { ...t, ...result };
    }),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Talent</p>
        <h1 className="text-3xl font-semibold tracking-tight">Risk &amp; opportunity</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Descriptive flags only — not predictions. Pair with manager judgment before decisions.
        </p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="nine-box" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">9-Box Grid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-rose-500/20 bg-rose-500/5 shadow-[0_8px_32px_rgba(225,29,72,0.1)] backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Higher-attention employees</CardTitle>
                <CardDescription>Large self/others gaps, stale activity, or low manager averages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {highRisk.slice(0, 40).map((r) => (
                  <div key={`${r.userId}-${r.reason}`} className="border-border rounded-lg border p-2">
                    <div className="font-medium">{r.name ?? r.email}</div>
                    <p className="text-muted-foreground text-xs">{r.reason}</p>
                  </div>
                ))}
                {highRisk.length === 0 ? <p className="text-muted-foreground">No flags from current rules.</p> : null}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-[0_8px_32px_rgba(16,185,129,0.1)] backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">High-potential signals</CardTitle>
                <CardDescription>Strong others-ratings vs modest self-ratings (coaching moment)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {highPotential.slice(0, 40).map((r) => (
                  <div key={`${r.userId}-${r.reason}`} className="border-border rounded-lg border p-2">
                    <div className="font-medium">{r.name ?? r.email}</div>
                    <p className="text-muted-foreground text-xs">{r.reason}</p>
                  </div>
                ))}
                {highPotential.length === 0 ? (
                  <p className="text-muted-foreground">No high-potential pattern detected from 360 data.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-cyan-500/20 bg-cyan-500/5 shadow-[0_8px_32px_rgba(6,182,212,0.1)] backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-cyan-500" />
                <CardTitle>Team personality composition</CardTitle>
              </div>
              <CardDescription>
                AI-generated coaching notes from Big Five averages (completed psychometric assessments). For
                facilitation — not selection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamsWithAiNarratives.length === 0 ? (
                <p className="text-muted-foreground text-sm">No psychometric completions yet.</p>
              ) : (
                teamsWithAiNarratives.map((t) => (
                  <div key={t.department} className="border-border rounded-xl border p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{t.department}</h3>
                      <div className="flex items-center gap-2">
                        {t.aiSource === "AI_GENERATED" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                            <Sparkles className="size-2.5" />
                            AI
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">n={t.n}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t.narrativeText}</p>
                    <OceanRadarChart 
                      data={{
                        o: t.avgOpenness,
                        c: t.avgConscientiousness,
                        e: t.avgExtraversion,
                        a: t.avgAgreeableness,
                        n: t.avgNeuroticism
                      }}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nine-box">
          <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-[0_8px_32px_rgba(99,102,241,0.1)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">9-Box Talent Grid</CardTitle>
              <CardDescription>Map employees across performance and potential dimensions.</CardDescription>
            </CardHeader>
            <CardContent>
              <NineBoxGrid placements={gridPlacements} employees={people} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
