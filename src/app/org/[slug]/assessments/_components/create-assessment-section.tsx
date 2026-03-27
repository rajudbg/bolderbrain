"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAssessment360 } from "../actions";

type TemplateOpt = { id: string; key: string; name: string; description: string | null };
type MemberRow = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string | null };
};

export function CreateAssessmentSection({
  slug,
  templates,
  members,
}: {
  slug: string;
  templates: TemplateOpt[];
  members: MemberRow[];
}) {
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [subjectUserId, setSubjectUserId] = useState("");
  const [managerUserId, setManagerUserId] = useState<string | "__none__">("__none__");
  const [peerIds, setPeerIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        userId: m.userId,
        label: m.user.name?.trim() || m.user.email || m.userId,
      })),
    [members],
  );

  function togglePeer(uid: string) {
    setPeerIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId || !subjectUserId || !title.trim()) {
      toast.error("Template, subject, and title are required");
      return;
    }
    const peerUserIds = [...peerIds].filter((id) => id !== subjectUserId);
    if (peerUserIds.some((id) => id === managerUserId)) {
      toast.error("Manager cannot also be a peer");
      return;
    }
    setPending(true);
    try {
      await createAssessment360({
        slug,
        templateId,
        subjectUserId,
        title: title.trim(),
        managerUserId: managerUserId === "__none__" ? null : managerUserId,
        peerUserIds,
      });
      toast.success("Assessment created; evaluators were notified.");
      setTitle("");
      setPeerIds(new Set());
      setManagerUserId("__none__");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No behavioral 360 templates</CardTitle>
          <CardDescription>
            Create a BEHAVIORAL_360 template and questions in Super Admin before scheduling an assessment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New 360 assessment</CardTitle>
        <CardDescription>
          Pick the subject (self rater), optional manager, and one or more peers. Bulk-add more peers later from the
          assessment detail page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q1 2025 leadership review"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject (self assessment)</Label>
            <Select value={subjectUserId || undefined} onValueChange={(v) => setSubjectUserId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {memberOptions.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Manager (optional)</Label>
            <Select
              value={managerUserId}
              onValueChange={(v) => setManagerUserId(v as typeof managerUserId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {memberOptions
                  .filter((m) => m.userId !== subjectUserId)
                  .map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Peers</Label>
            <p className="text-muted-foreground text-xs">Select multiple peer reviewers.</p>
            <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {memberOptions
                .filter((m) => m.userId !== subjectUserId)
                .map((m) => (
                  <label
                    key={m.userId}
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={peerIds.has(m.userId)}
                      onCheckedChange={() => togglePeer(m.userId)}
                      disabled={managerUserId !== "__none__" && m.userId === managerUserId}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create assessment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
