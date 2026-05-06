"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { createAssessmentTna } from "../actions";

type TemplateOpt = { id: string; key: string; name: string; description: string | null };
type MemberRow = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string | null };
};

export function CreateTnaSection({
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
  const [pending, setPending] = useState(false);

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        userId: m.userId,
        label: m.user.name?.trim() || m.user.email || m.userId,
      })),
    [members],
  );

  const selectedTemplateName = useMemo(() => {
    return templates.find((t) => t.id === templateId)?.name ?? "Template";
  }, [templateId, templates]);

  const selectedSubjectLabel = useMemo(() => {
    if (!subjectUserId) return "Select employee";
    return memberOptions.find((m) => m.userId === subjectUserId)?.label ?? "Select employee";
  }, [subjectUserId, memberOptions]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId || !subjectUserId || !title.trim()) {
      toast.error("Template, subject, and title are required");
      return;
    }
    setPending(true);
    try {
      await createAssessmentTna({
        slug,
        templateId,
        subjectUserId,
        title: title.trim(),
      });
      toast.success("TNA diagnostic launched; the participant was notified.");
      setTitle("");
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
          <CardTitle>No TNA diagnostic templates</CardTitle>
          <CardDescription>
            Create a TNA_DIAGNOSTIC template and Likert questions (trait category = competency key) in Super Admin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New TNA diagnostic</CardTitle>
        <CardDescription>
          Self-report skills audit. When the participant submits, gaps vs competency targets generate training needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="tna-title">Title</Label>
            <Input
              id="tna-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="FY26 org-wide skills audit"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Template">
                  {selectedTemplateName}
                </SelectValue>
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
            <Label>Participant</Label>
            <Select value={subjectUserId || undefined} onValueChange={(v) => setSubjectUserId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee">
                  {selectedSubjectLabel}
                </SelectValue>
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
          <Button type="submit" disabled={pending}>
            {pending ? "Launching…" : "Launch TNA diagnostic"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
