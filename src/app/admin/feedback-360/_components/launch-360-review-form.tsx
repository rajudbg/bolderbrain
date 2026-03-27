"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { createAssessment360Admin } from "@/app/admin/hr-actions";
import { cn } from "@/lib/utils";

/** Sentinel so Subject Select stays controlled from first render (never `value={undefined}`). */
const EMPTY_SUBJECT = "__launch_subject__" as const;

const selectContentClass =
  "border border-white/12 bg-[#161618] text-white/95 shadow-xl shadow-black/40 [&_[data-slot=select-item]]:text-white/90";

type TemplateOpt = { id: string; key: string; name: string; description: string | null };
type MemberRow = {
  userId: string;
  user: { id: string; name: string | null; email: string | null };
};

export function Launch360ReviewForm({
  organizationName,
  templates,
  members,
}: {
  organizationName: string;
  templates: TemplateOpt[];
  members: MemberRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [subjectUserId, setSubjectUserId] = useState<string>(EMPTY_SUBJECT);
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

  /** Base UI Select: pass `items` so trigger labels resolve when the popup list is unmounted. */
  const templateItems = useMemo(
    () => templates.map((t) => ({ value: t.id, label: t.name })),
    [templates],
  );
  const subjectItems = useMemo(
    () => [
      { value: EMPTY_SUBJECT, label: "Select employee" },
      ...memberOptions.map((m) => ({ value: m.userId, label: m.label })),
    ],
    [memberOptions],
  );
  const managerItems = useMemo(() => {
    const rest = memberOptions
      .filter((m) => m.userId !== subjectUserId)
      .map((m) => ({ value: m.userId, label: m.label }));
    return [{ value: "__none__" as const, label: "None" }, ...rest];
  }, [memberOptions, subjectUserId]);

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
    if (!templateId || subjectUserId === EMPTY_SUBJECT || !title.trim()) {
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
      await createAssessment360Admin({
        templateId,
        subjectUserId,
        title: title.trim(),
        managerUserId: managerUserId === "__none__" ? null : managerUserId,
        peerUserIds,
      });
      toast.success("360 review launched — evaluators were notified.");
      router.push("/admin/feedback-360");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setPending(false);
    }
  }

  if (templates.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/admin/feedback-360"
          className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/90"
        >
          <ArrowLeft className="size-4" />
          Back to console
        </Link>
        <div className="rounded-[2rem] border border-amber-500/25 bg-[#0F0F11]/90 p-8 shadow-[0_0_40px_rgba(245,158,11,0.12)] backdrop-blur-xl">
          <h1 className="font-heading text-xl font-semibold text-white/90">No behavioral 360 templates</h1>
          <p className="mt-2 text-sm text-white/55">
            Create a BEHAVIORAL_360 template and questions in Super Admin for {organizationName} before launching a
            review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/feedback-360"
          className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/90"
        >
          <ArrowLeft className="size-4" />
          Back to console
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text">
          Launch 360 review
        </h1>
        <p className="mt-2 text-sm text-white/55">{organizationName}</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-[2rem] border border-white/[0.12] bg-[#0F0F11]/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q1 2025 leadership review"
              required
              className="border-white/10 bg-white/[0.05] text-white/90 ring-offset-[#0F0F11]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Template</Label>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")} items={templateItems}>
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Subject (self assessment)</Label>
            <Select
              value={subjectUserId}
              onValueChange={(v) => setSubjectUserId(v ?? EMPTY_SUBJECT)}
              items={subjectItems}
            >
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value={EMPTY_SUBJECT}>Select employee</SelectItem>
                {memberOptions.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Manager (optional)</Label>
            <Select
              value={managerUserId}
              onValueChange={(v) => setManagerUserId(v as typeof managerUserId)}
              items={managerItems}
            >
              <SelectTrigger className="border-white/10 bg-white/[0.05] text-white/90">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
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
            <Label className="text-white/80">Peers</Label>
            <p className="text-xs text-white/45">Select peer reviewers (one or more).</p>
            <div className="max-h-52 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03]">
              {memberOptions
                .filter((m) => m.userId !== subjectUserId)
                .map((m) => (
                  <label
                    key={m.userId}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.04]"
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
          <Button
            type="submit"
            disabled={pending}
            className={cn(
              "w-full bg-gradient-to-r from-amber-500 to-orange-500 py-6 text-base font-semibold text-black shadow-lg shadow-amber-500/25 hover:scale-[1.02] hover:shadow-amber-500/40 sm:w-auto sm:px-10",
            )}
          >
            {pending ? "Launching…" : "Launch 360 Review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
