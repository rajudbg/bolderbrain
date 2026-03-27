"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { build360Csv, buildPeopleCsv } from "../reports-actions";

export function ReportsClient({ kind }: { kind: "people" | "360" }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const csv = kind === "people" ? await buildPeopleCsv() : await build360Csv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "people" ? "people-roster.csv" : "360-assessments.csv";
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
