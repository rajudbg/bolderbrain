"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resetDemoDataAction } from "./demo-actions";

export function ResetDemoButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={loading}
      className="min-h-11 min-w-[44px]"
      onClick={async () => {
        if (!window.confirm("Wipe the Acme Corp demo organization and reseed all demo data?")) {
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
      {loading ? "Resetting…" : "Reset demo data"}
    </Button>
  );
}
