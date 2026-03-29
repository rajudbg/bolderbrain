"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { glassCardClassName } from "@/components/cerebral-glass";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startOrResumeEqAttempt } from "./actions";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  organization: { name: string; slug: string };
  _count: { questions: number };
};

export function EqStartClient({
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
    const el = document.getElementById(`eq-template-${focusTemplateId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusTemplateId]);

  async function onStart(templateId: string) {
    setPendingId(templateId);
    try {
      const { attemptId } = await startOrResumeEqAttempt(templateId);
      router.push(`/app/assessments/eq/${attemptId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
    } finally {
      setPendingId(null);
    }
  }

  if (templates.length === 0) {
    return (
      <Card className={cn(glassCardClassName(), "border-dashed border-amber-500/25 bg-amber-950/15")}>
        <CardHeader>
          <CardTitle className="font-heading text-base text-white/90">No EQ assessments yet</CardTitle>
          <CardDescription className="text-white/50">
            Your organization needs an EQ template and questions configured in Super Admin.
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
          id={`eq-template-${t.id}`}
          className={cn(
            glassCardClassName(),
            "border-amber-500/10",
            focusTemplateId === t.id && "ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-[#0F0F11]",
          )}
        >
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 text-amber-300">
                <Heart className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="font-heading text-lg leading-tight text-white/90">{t.name}</CardTitle>
                <CardDescription className="text-xs text-white/45">
                  {t.organization.name} · {t._count.questions} question{t._count.questions === 1 ? "" : "s"}
                </CardDescription>
              </div>
            </div>
            {t.description ? <p className="mt-2 text-sm text-white/55">{t.description}</p> : null}
          </CardHeader>
          <CardContent>
            <Button className="w-full" type="button" disabled={t._count.questions === 0 || pendingId === t.id} onClick={() => onStart(t.id)}>
              {pendingId === t.id ? "Opening…" : "Begin or resume"}
            </Button>
            {t._count.questions === 0 ? (
              <p className="mt-2 text-center text-xs text-white/45">Add questions first.</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
