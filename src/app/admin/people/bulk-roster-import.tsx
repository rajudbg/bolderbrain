"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importPeopleRoster } from "@/app/admin/hr-actions";

const SAMPLE = "email,name,department,role\ncarol@example.com,Carol Lee,Engineering,EMPLOYEE";

export function BulkRosterImport() {
  const [csv, setCsv] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        const result = await importPeopleRoster(csv);
        toast.success("Roster imported", { description: result.message });
        setCsv("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        className="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-xs"
        rows={5}
        placeholder={SAMPLE}
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit} disabled={pending || csv.trim().length === 0}>
          <Upload className="size-4" />
          {pending ? "Importing..." : "Import roster"}
        </Button>
        <p className="text-muted-foreground text-xs">
          New users are created inactive; activate them after credentials or SSO are ready.
        </p>
      </div>
    </div>
  );
}
