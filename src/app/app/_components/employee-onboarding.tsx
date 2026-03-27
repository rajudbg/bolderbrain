"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "bb.onboarding.dismissed.v1";

export function EmployeeOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          setOpen(true);
        }
      } catch {
        setOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div className="border-primary/20 bg-primary/5 mb-8 rounded-xl border p-4 shadow-sm">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Welcome to BolderBrain</CardTitle>
          <CardDescription>
            Quick start: set up your competency framework (HR admin), invite your team, launch a 360, then review
            results in the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
            <li>Invite colleagues and assign departments.</li>
            <li>Create a behavioral 360 using your competency template.</li>
            <li>Review aggregated results and development actions.</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/assessments" className={cn(buttonVariants({ size: "sm" }))}>
              Go to assessments
            </Link>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => {
                try {
                  window.localStorage.setItem(STORAGE_KEY, "1");
                } catch {
                  /* ignore */
                }
                setOpen(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
