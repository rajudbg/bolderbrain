import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTalentLists, getTeamPsychSummary } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { generateTeamDynamicsNarrative } from "@/lib/ai/eq-psych-narratives";

export default async function TalentInsightsPage() {
  const orgId = await requireAdminOrganizationId();
  const [{ highRisk, highPotential }, psychTeams] = await Promise.all([
    getTalentLists(orgId),
    getTeamPsychSummary(orgId),
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-rose-200/70 dark:border-rose-900/40">
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

        <Card className="border-emerald-200/70 dark:border-emerald-900/40">
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

      <Card>
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
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                  <div>
                    <dt className="text-muted-foreground">O</dt>
                    <dd className="tabular-nums">{t.avgOpenness}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">C</dt>
                    <dd className="tabular-nums">{t.avgConscientiousness}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">E</dt>
                    <dd className="tabular-nums">{t.avgExtraversion}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">A</dt>
                    <dd className="tabular-nums">{t.avgAgreeableness}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">N</dt>
                    <dd className="tabular-nums">{t.avgNeuroticism}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
