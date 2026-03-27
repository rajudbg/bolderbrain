import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CompetencyTrend } from "@/lib/action-engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompetencyTrendsBlock({ trends }: { trends: CompetencyTrend[] }) {
  const withDelta = trends.filter((t) => t.deltaFromPrevious !== null);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Improvement signals</CardTitle>
        <CardDescription>
          Change in others&apos; average rating vs your previous 360 (same competency).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {withDelta.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            After a second completed 360, you&apos;ll see how others&apos; ratings moved here.
          </p>
        ) : (
        <ul className="space-y-3">
          {withDelta.map((t) => (
            <li
              key={t.competencyKey}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">{t.competencyKey}</span>
              <span className="text-muted-foreground flex items-center gap-1.5 tabular-nums">
                {t.deltaFromPrevious! > 0.05 ? (
                  <>
                    <TrendingUp className="size-4 text-emerald-600" />
                    <span className="text-emerald-700">+{t.deltaFromPrevious!.toFixed(1)}</span>
                  </>
                ) : t.deltaFromPrevious! < -0.05 ? (
                  <>
                    <TrendingDown className="size-4 text-rose-600" />
                    <span className="text-rose-700">{t.deltaFromPrevious!.toFixed(1)}</span>
                  </>
                ) : (
                  <>
                    <Minus className="text-muted-foreground size-4" />
                    <span>~{t.deltaFromPrevious!.toFixed(1)}</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        )}
      </CardContent>
    </Card>
  );
}
