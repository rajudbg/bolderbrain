"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpenRouterPingResult } from "@/lib/ai/run-openrouter-ping";

type TestFn = () => Promise<OpenRouterPingResult>;

export function AiConnectionTestCard({
  variant,
  testAction,
}: {
  variant: "employee" | "admin";
  testAction: TestFn;
}) {
  const [pending, start] = useTransition();
  const [last, setLast] = useState<OpenRouterPingResult | null>(null);

  const isAdmin = variant === "admin";

  function run() {
    start(async () => {
      try {
        const r = await testAction();
        setLast(r);
        if (r.ok) {
          toast.success("AI connection OK", {
            description: r.model ? `${r.model} · ${r.latencyMs ?? "—"}ms` : undefined,
          });
        } else {
          toast.error("AI connection failed", { description: r.message });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Request failed");
      }
    });
  }

  const cardClass = isAdmin
    ? "border-white/10 bg-white/[0.03] text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    : "border-border/60 shadow-sm";

  const descClass = isAdmin ? "text-white/50" : "text-muted-foreground";
  const mutedClass = isAdmin ? "text-white/45" : "text-muted-foreground";
  const okClass = isAdmin ? "text-emerald-400" : "text-emerald-600";
  const badClass = isAdmin ? "text-red-400" : "text-red-600";

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={isAdmin ? "text-white/95" : undefined}>Test AI connection</CardTitle>
        <CardDescription className={descClass}>
          Calls OpenRouter with a one-token check using <code className="text-xs">OPENROUTER_API_KEY</code> on the
          server. No prompts leave your org context beyond this health check.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={run} disabled={pending} variant={isAdmin ? "secondary" : "default"}>
            {pending ? "Testing…" : "Run connection test"}
          </Button>
          {last && (
            <span className={`text-sm font-medium ${last.ok ? okClass : badClass}`}>
              {last.ok ? "Connected" : "Failed"}
            </span>
          )}
        </div>
        <p className={`text-xs ${mutedClass}`}>
          API key configured:{" "}
          <strong className={last?.hasKey === false ? badClass : okClass}>{last ? (last.hasKey ? "yes" : "no") : "—"}</strong>
          {last?.model ? (
            <>
              {" "}
              · Model: <span className="font-mono">{last.model}</span>
            </>
          ) : null}
          {last?.latencyMs != null ? <> · {last.latencyMs}ms</> : null}
        </p>
        {last?.message && (
          <p className={`rounded-lg border px-3 py-2 text-sm ${isAdmin ? "border-white/10 bg-black/20 text-white/75" : "bg-muted/40 text-foreground/90"}`}>
            {last.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
