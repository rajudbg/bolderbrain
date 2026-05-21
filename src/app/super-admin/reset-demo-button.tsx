"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedDemoDataAction, resetDemoDataAction } from "./demo-actions";

export function SeedDemoButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="default"
      disabled={loading}
      className="min-h-11 min-w-[44px]"
      onClick={async () => {
        if (!window.confirm("Seed the demo data? This adds Acme Corp and 3 other tenants with users, assessments, and training data.")) {
          return;
        }
        setLoading(true);
        try {
          await seedDemoDataAction();
          toast.success("Demo data seeded.");
        } catch {
          toast.error("Could not seed demo data.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Seeding…" : "Seed demo data"}
    </Button>
  );
}

export function ResetDemoButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={loading}
      className="min-h-11 min-w-[44px]"
      onClick={async () => {
        if (!window.confirm("Wipe all demo organizations and reseed all demo data? This cannot be undone.")) {
          return;
        }
        setLoading(true);
        try {
          await resetDemoDataAction();
          toast.success("Demo data reset.");
        } catch {
          toast.error("Could not reset demo data.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Resetting…" : "Reset all demo data"}
    </Button>
  );
}
