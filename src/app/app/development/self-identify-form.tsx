"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSelfIdentifiedTrainingNeed } from "./actions";

export function SelfIdentifyForm({
  competencies,
}: {
  competencies: { id: string; name: string }[];
}) {
  const [competencyId, setCompetencyId] = useState(competencies[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const selectedCompetencyName = useMemo(() => {
    return competencies.find((c) => c.id === competencyId)?.name ?? "Choose competency";
  }, [competencyId, competencies]);

  if (competencies.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Nominate a development need</CardTitle>
          <CardDescription>No competencies configured for your organization yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Nominate a development need</CardTitle>
        <CardDescription>
          Creates a training need with source <span className="text-amber-400/90">self-identified</span> for HR to
          review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Competency</Label>
          <Select value={competencyId} onValueChange={(v) => setCompetencyId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose competency">
                {selectedCompetencyName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {competencies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dev-note">Context (optional)</Label>
          <Textarea
            id="dev-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What support would help you most?"
          />
        </div>
        <Button
          type="button"
          disabled={!competencyId || pending}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-95"
          onClick={() => {
            start(async () => {
              try {
                await createSelfIdentifiedTrainingNeed({ competencyId, note: note.trim() || undefined });
                toast.success("Development need recorded");
                setNote("");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save");
              }
            });
          }}
        >
          {pending ? "Saving…" : "Submit need"}
        </Button>
      </CardContent>
    </Card>
  );
}
