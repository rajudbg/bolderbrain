"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startOrResumePsychAttempt } from "./actions";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  organization: { name: string; slug: string };
  _count: { questions: number };
};

export function PsychStartClient({
  templates,
  focusTemplateId,
}: {
  templates: Row[];
  focusTemplateId?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusTemplateId) return;
    const el = document.getElementById(`psych-template-${focusTemplateId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusTemplateId]);

  async function onStart(templateId: string) {
    setPendingId(templateId);
    try {
      const { attemptId } = await startOrResumePsychAttempt(templateId);
      router.push(`/app/assessments/psychometric/${attemptId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
    } finally {
      setPendingId(null);
    }
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed border-violet-200/60 bg-violet-50/20 dark:border-violet-900/40 dark:bg-violet-950/10">
        <CardHeader>
          <CardTitle className="text-base">No personality assessments yet</CardTitle>
          <CardDescription>
            Your organization needs a psychometric template and items configured in Super Admin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {templates.map((t) => (
        <Card
          key={t.id}
          id={`psych-template-${t.id}`}
          className={cn(
            "border-violet-200/50 shadow-sm dark:border-violet-900/30",
            focusTemplateId === t.id && "ring-2 ring-indigo-500/50 ring-offset-2 dark:ring-offset-background",
          )}
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-400">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg leading-tight">{t.name}</CardTitle>
                <CardDescription className="text-xs">
                  {t.organization.name} · {t._count.questions} item{t._count.questions === 1 ? "" : "s"}
                </CardDescription>
              </div>
            </div>
            {t.description ? <p className="text-muted-foreground mt-2 text-sm">{t.description}</p> : null}
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
              type="button"
              disabled={t._count.questions === 0 || pendingId === t.id}
              onClick={() => onStart(t.id)}
            >
              {pendingId === t.id ? "Opening…" : "Begin or resume"}
            </Button>
            {t._count.questions === 0 ? (
              <p className="text-muted-foreground mt-2 text-center text-xs">Add questions first.</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
