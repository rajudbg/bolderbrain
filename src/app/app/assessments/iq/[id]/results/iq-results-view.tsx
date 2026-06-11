"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IqCategoryKey } from "@/lib/iq-scoring";
import { IqBellCurve } from "./iq-bell-curve";
import { generatePdf } from "@/lib/pdf/export-pdf";

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
    breakdownByCategory: Record<IqCategoryKey, { percentile: number; correct: number; total: number }>;
  };
}) {
  const [exporting, setExporting] = useState(false);

  const pass = passingStandardScore != null ? result.standardScore >= passingStandardScore : null;

  async function handleExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const sections: { element: HTMLElement; title?: string }[] = [];
      const el = document.getElementById("iq-pdf-content");
      if (el) {
        const cards = el.querySelectorAll("[data-pdf-card]");
        cards.forEach((c) => sections.push({ element: c as HTMLElement }));
      }
      if (sections.length === 0) throw new Error("PDF content not found");

      await generatePdf({
        reportTitle: "Cognitive Assessment Report",
        subjectName: templateName,
        sections,
        filename: `cognitive-assessment_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {/* Screen view */}
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="space-y-8">
          <header className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Results</p>
            <h1 className="text-3xl font-semibold tracking-tight">{templateName}</h1>
          </header>

          <Card className="border-border/60 overflow-hidden">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score distribution</CardTitle>
              <CardDescription>Normal curve (μ=100, σ=15) with your score marked.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <IqBellCurve userScore={result.standardScore} />
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

        <div className="flex justify-end">
          <Button type="button" className="gap-2" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            {exporting ? "Generating PDF…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Hidden off-screen PDF content — light themed for clean capture */}
      <div id="iq-pdf-content" className="fixed left-[-9999px] top-0 w-[820px] bg-white p-10" style={{ zIndex: -1 }}>
        <div data-pdf-card className="mb-8">
          <p className="text-3xl font-bold text-gray-900 mb-1">{templateName}</p>
          <p className="text-sm text-gray-500 mb-6">Cognitive Assessment Report</p>
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-5xl font-bold text-indigo-600">{Math.round(result.standardScore)}</span>
            <div>
              <p className="text-sm text-gray-700">Standard score (μ=100, σ=15)</p>
              <p className="text-xs text-gray-500">
                Higher than ~{result.percentile.toFixed(1)}% of population · 90% band: {Math.round(result.ciLow)}–{Math.round(result.ciHigh)}
              </p>
            </div>
          </div>
          <p className="text-lg font-semibold text-indigo-600 mb-1">{result.categoryLabel}</p>
          {pass !== null && (
            <p className={`text-sm font-medium ${pass ? "text-green-700" : "text-amber-700"}`}>
              Screening threshold: {pass ? "Pass" : "Below"} (≥ {passingStandardScore})
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {result.rawCorrectCount} correct · weighted {result.weightedScore.toFixed(2)} / {result.maxWeighted.toFixed(2)}
          </p>
        </div>

        <div data-pdf-card className="mb-8">
          <p className="text-base font-semibold text-gray-900 mb-3">Score distribution</p>
          <p className="text-sm text-gray-700 mb-2">Standard score: {Math.round(result.standardScore)} (μ=100, σ=15)</p>
          <p className="text-sm text-gray-700 mb-2">Percentile: ~{result.percentile.toFixed(1)}%</p>
          <p className="text-sm text-gray-700 mb-2">90% confidence band: {Math.round(result.ciLow)}–{Math.round(result.ciHigh)}</p>
          <p className="text-sm text-gray-700 mb-3">Category: {result.categoryLabel}</p>
          {result.breakdownByCategory && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left font-semibold text-gray-700 py-2">Area</th>
                  <th className="text-right font-semibold text-gray-700 py-2">Correct</th>
                  <th className="text-right font-semibold text-gray-700 py-2">Percentile</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(CATEGORY_LABEL) as IqCategoryKey[]).map((key) => {
                  const b = result.breakdownByCategory[key];
                  if (!b || b.total === 0) return null;
                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{CATEGORY_LABEL[key]}</td>
                      <td className="py-2 text-right text-gray-700">{b.correct}/{b.total}</td>
                      <td className="py-2 text-right text-gray-700">~{b.percentile.toFixed(0)}th</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div data-pdf-card className="mb-8">
          <p className="text-base font-semibold text-gray-900 mb-3">Workplace interpretation</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.interpretation}</p>
        </div>
      </div>
    </>
  );
}
