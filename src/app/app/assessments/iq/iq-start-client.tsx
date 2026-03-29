"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startIqAttempt } from "./actions";
import { cn } from "@/lib/utils";

type TemplateRow = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  organization: { name: string; slug: string };
  _count: { questions: number };
};

export function IqStartClient({
  templates,
  focusTemplateId,
}: {
  templates: TemplateRow[];
  focusTemplateId?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusTemplateId) return;
    const el = document.getElementById(`iq-template-${focusTemplateId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusTemplateId]);

  async function onStart(templateId: string) {
    setPendingId(templateId);
    try {
      const { attemptId } = await startIqAttempt(templateId);
      router.push(`/app/assessments/iq/${attemptId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start attempt");
    } finally {
      setPendingId(null);
    }
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">No cognitive assessments</CardTitle>
          <CardDescription>
            Your organization has not published an IQ / cognitive template yet, or you are not a member of an org with one configured.
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
          id={`iq-template-${t.id}`}
          className={cn(
            "border-border/60 shadow-sm",
            focusTemplateId === t.id && "ring-2 ring-indigo-500/50 ring-offset-2",
          )}
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Brain className="text-primary size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg leading-tight">{t.name}</CardTitle>
                <CardDescription className="text-xs">
                  {t.organization.name} · {t._count.questions} gradable item{t._count.questions === 1 ? "" : "s"} in bank
                </CardDescription>
              </div>
            </div>
            {t.description ? <p className="text-muted-foreground mt-2 text-sm">{t.description}</p> : null}
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              type="button"
              disabled={t._count.questions === 0 || pendingId === t.id}
              onClick={() => onStart(t.id)}
            >
              {pendingId === t.id ? "Starting…" : "Start test"}
            </Button>
            {t._count.questions === 0 ? (
              <p className="text-muted-foreground mt-2 text-center text-xs">No questions in pool yet.</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
