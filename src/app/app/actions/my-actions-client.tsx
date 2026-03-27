"use client";

import { useState } from "react";
import { toast } from "sonner";
import { completeMyUserAction, dismissMyUserAction, startMyUserAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  competencyName: string;
  competencyKey: string;
  status: string;
  assignedAt: string;
};

type HistoryRow = Omit<Row, "competencyKey" | "assignedAt"> & { weekKey: string; assignedAt: string };

function difficultyVariant(d: string): "default" | "secondary" | "outline" {
  if (d === "HARD") return "default";
  if (d === "MEDIUM") return "secondary";
  return "outline";
}

export function MyActionsClient({
  weekKey,
  thisWeek,
  history,
  streak,
}: {
  weekKey: string;
  thisWeek: Row[];
  history: HistoryRow[];
  streak: number;
}) {
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [busy, setBusy] = useState(false);

  const active = thisWeek.filter((r) => r.status !== "DISMISSED");
  const done = active.filter((r) => r.status === "COMPLETED").length;
  const total = active.length;

  async function onComplete(id: string) {
    setBusy(true);
    try {
      await completeMyUserAction(id);
      toast.success("Nice work — marked complete.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDismiss() {
    if (!dismissId || !dismissReason.trim()) {
      toast.error("Add a short reason");
      return;
    }
    setBusy(true);
    try {
      await dismissMyUserAction({ userActionId: dismissId, reason: dismissReason.trim() });
      toast.success("Action dismissed");
      setDismissId(null);
      setDismissReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My actions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Week {weekKey}
            {streak > 0 ? ` · ${streak} week completion streak` : ""}
          </p>
        </div>
        <div className="text-muted-foreground text-sm tabular-nums">
          This week: {total === 0 ? "—" : `${done} / ${total} completed`}
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">This week&apos;s focus</h2>
        {active.length === 0 ? (
          <Card className="border-dashed shadow-sm">
            <CardContent className="py-14 text-center">
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Great job — no development actions this week. New ones may appear after your next 360.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((a) => (
              <Card
                key={a.id}
                className={cn(
                  "border-border/60 shadow-sm transition-shadow hover:shadow-md",
                  a.status === "COMPLETED" && "border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge variant="secondary">{a.competencyName}</Badge>
                    <Badge variant={difficultyVariant(a.difficulty)}>{a.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                  <CardDescription className="text-xs">
                    ~{a.estimatedTime} min · Assigned {new Date(a.assignedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{a.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "ASSIGNED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void startMyUserAction(a.id)}
                      >
                        Start
                      </Button>
                    )}
                    {a.status !== "COMPLETED" && (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => void onComplete(a.id)}>
                          Mark complete
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDismissId(a.id)}>
                          Skip / dismiss
                        </Button>
                      </>
                    )}
                    {a.status === "COMPLETED" && (
                      <span className="text-primary text-sm font-medium">Completed</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">History</h2>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No past actions yet.</p>
        ) : (
          <div className="rounded-xl border">
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{h.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {h.competencyName} · {h.weekKey} · {h.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant="outline">{h.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Dialog open={Boolean(dismissId)} onOpenChange={(o) => !o && setDismissId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip this action?</DialogTitle>
            <DialogDescription>
              Share a brief reason (helps your coach or admin understand context).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              rows={3}
              placeholder="e.g. Already practicing this in my current project"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissId(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void onDismiss()}>
              Dismiss action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
