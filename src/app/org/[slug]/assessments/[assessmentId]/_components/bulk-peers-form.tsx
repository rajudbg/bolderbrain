"use client";

import { useState } from "react";
import { toast } from "sonner";
import { bulkAddPeers } from "../../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type MemberRow = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string | null };
};

export function BulkPeersForm({
  slug,
  assessmentId,
  members,
  existingUserIds,
  subjectUserId,
}: {
  slug: string;
  assessmentId: string;
  members: MemberRow[];
  existingUserIds: string[];
  subjectUserId: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const existing = new Set(existingUserIds);
  const available = members.filter((m) => !existing.has(m.userId) && m.userId !== subjectUserId);

  function toggle(uid: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const peerUserIds = [...selected];
    if (peerUserIds.length === 0) {
      toast.error("Select at least one peer");
      return;
    }
    setPending(true);
    try {
      await bulkAddPeers({ slug, assessmentId, peerUserIds });
      toast.success("Peers added and notified");
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (available.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add peer reviewers</CardTitle>
        <CardDescription>Select additional peers in bulk. Each receives an email with their assessment link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label>Available members</Label>
            <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {available.map((m) => {
                const label = m.user.name?.trim() || m.user.email || m.userId;
                return (
                  <label
                    key={m.userId}
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox checked={selected.has(m.userId)} onCheckedChange={() => toggle(m.userId)} />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add peers"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
