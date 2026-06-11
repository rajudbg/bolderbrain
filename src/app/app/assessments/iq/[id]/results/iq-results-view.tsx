"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IqCategoryKey } from "@/lib/iq-scoring";
import { IqBellCurve } from "./iq-bell-curve";

const CATEGORY_LABEL: Record<IqCategoryKey, string> = {
  verbal: "Verbal",
  numerical: "Numerical",
  logical: "Logical",
  spatial: "Spatial",
  general: "General",
};

export function IqResultsView({
  templateName,
  passingStandardScore,
  result,
}: {
  templateName: string;
  passingStandardScore?: number;
  result: {
    standardScore: number;
    percentile: number;
    ciLow: number;
    ciHigh: number;
    categoryLabel: string;
    rawCorrectCount: number;
    weightedScore: number;
    maxWeighted: number;
    interpretation: string;
    breakdownByCategory: Record<
      IqCategoryKey,
      { percentile: number; correct: number; total: number }
    >;
  };
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const pass =
    passingStandardScore != null ? result.standardScore >= passingStandardScore : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div ref={printRef} className="space-y-8 print:space-y-6">
        <h1 className="hidden print:block text-2xl font-bold mb-4">{templateName}</h1>
        <header className="space-y-1 print:hidden">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Results</p>
          <h1 className="text-3xl font-semibold tracking-tight">{templateName}</h1>
        </header>

        <Card className="border-border/60 overflow-hidden print-bg-preserve print:border print:shadow-none">
          <CardHeader className="from-primary/5 via-background to-background border-b bg-gradient-to-br pb-8">
            <CardDescription className="text-xs uppercase">Standard score (μ=100, σ=15)</CardDescription>
            <div className="flex flex-wrap items-end gap-4">
              <span className="text-6xl font-bold tabular-nums tracking-tight">{Math.round(result.standardScore)}</span>
              <div className="pb-1">
                <p className="text-muted-foreground text-sm">
                  You scored higher than approximately {result.percentile.toFixed(1)}% of the population (mock norm).
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  90% confidence-style band: {Math.round(result.ciLow)}–{Math.round(result.ciHigh)} (±5 points)
                </p>
              </div>
            </div>
            <p className="text-primary mt-2 text-lg font-semibold">{result.categoryLabel}</p>
            {pass !== null ? (
              <p className={`text-sm font-medium ${pass ? "text-emerald-600" : "text-amber-600"}`}>
                Screening threshold: {pass ? "Pass" : "Below"} (≥ {passingStandardScore})
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              {result.rawCorrectCount} correct · weighted {result.weightedScore.toFixed(2)} / {result.maxWeighted.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-base">Score distribution</CardTitle>
            <CardDescription>Normal curve (μ=100, σ=15) with your score marked.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 print:hidden">
            <IqBellCurve userScore={result.standardScore} />
          </CardContent>
          <CardContent className="hidden print:block space-y-2">
            <p className="text-sm font-medium">Standard score: {Math.round(result.standardScore)} (μ=100, σ=15)</p>
            <p className="text-sm">Percentile: ~{result.percentile.toFixed(1)}%</p>
            <p className="text-sm">90% confidence band: {Math.round(result.ciLow)}–{Math.round(result.ciHigh)}</p>
            <p className="text-sm">Category: {result.categoryLabel}</p>
            <p className="text-sm">
              Raw: {result.rawCorrectCount} correct · weighted {result.weightedScore.toFixed(2)} / {result.maxWeighted.toFixed(2)}
            </p>
            {result.breakdownByCategory && (
              <table className="w-full mt-3 border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold pb-1 border-b">Area</th>
                    <th className="text-right text-xs font-semibold pb-1 border-b">Correct</th>
                    <th className="text-right text-xs font-semibold pb-1 border-b">Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(CATEGORY_LABEL) as IqCategoryKey[]).map((key) => {
                    const b = result.breakdownByCategory[key];
                    if (!b || b.total === 0) return null;
                    return (
                      <tr key={key}>
                        <td className="text-sm py-1">{CATEGORY_LABEL[key]}</td>
                        <td className="text-sm text-right py-1">{b.correct}/{b.total}</td>
                        <td className="text-sm text-right py-1">~{b.percentile.toFixed(0)}th</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Area breakdown</CardTitle>
            <CardDescription>Approximate percentile by content area (mock norms).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(CATEGORY_LABEL) as IqCategoryKey[]).map((key) => {
                const b = result.breakdownByCategory[key];
                if (!b || b.total === 0) return null;
                return (
                  <li key={key} className="border-border rounded-md border px-3 py-2">
                    <p className="text-sm font-medium">{CATEGORY_LABEL[key]}</p>
                    <p className="text-muted-foreground text-xs">
                      {b.correct}/{b.total} correct · ~{b.percentile.toFixed(0)}th percentile
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workplace interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{result.interpretation}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end print:hidden">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            document.title = `Cognitive Assessment — ${templateName} — BolderBrain`;
            window.print();
          }}
        >
          <Printer className="size-4" />
          Export / print PDF
        </Button>
      </div>
    </div>
  );
}
