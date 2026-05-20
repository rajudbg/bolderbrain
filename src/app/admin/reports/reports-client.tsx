"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  build360Csv,
  buildEqCsv,
  buildIqCsv,
  buildPeopleCsv,
  buildPsychometricCsv,
  buildTalentCsv,
  buildTrainingImpactCsv,
} from "../reports-actions";

type ExportKind = "people" | "360" | "eq" | "psychometric" | "iq" | "training" | "talent";

const actions = {
  people: buildPeopleCsv,
  "360": build360Csv,
  eq: buildEqCsv,
  psychometric: buildPsychometricCsv,
  iq: buildIqCsv,
  training: buildTrainingImpactCsv,
  talent: buildTalentCsv,
} as const;

const filenames: Record<ExportKind, string> = {
  people: "people-roster.csv",
  "360": "360-assessments.csv",
  eq: "eq-results.csv",
  psychometric: "psychometric-results.csv",
  iq: "iq-results.csv",
  training: "training-impact.csv",
  talent: "talent-lists.csv",
};

export function ReportsClient({ kind }: { kind: ExportKind }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const csv = await actions[kind]();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenames[kind];
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" onClick={() => void download()} disabled={busy}>
      {busy ? "Preparing…" : "Download CSV"}
    </Button>
  );
}

export function ReportsPrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
