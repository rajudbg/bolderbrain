"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { orgDismissUserAction, orgManualAssignAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Member = {
  userId: string;
  user: { id: string; name: string | null; email: string | null };
};

type ActionOpt = {
  id: string;
  title: string;
  competency: { name: string; key: string };
};

type Recent = {
  id: string;
  status: string;
  weekKey: string;
  user: { name: string | null; email: string | null };
  action: { title: string };
};

export function OrgDevelopmentClient({
  slug,
  members,
  actions,
  recentAssignments,
}: {
  slug: string;
  members: Member[];
  actions: ActionOpt[];
  recentAssignments: Recent[];
}) {
  const [userId, setUserId] = useState("");
  const [actionId, setActionId] = useState("");
  const [dismissId, setDismissId] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedUserLabel = useMemo(() => {
    if (!userId) return "Select user";
    return members.find((m) => m.userId === userId)?.user.name?.trim() || members.find((m) => m.userId === userId)?.user.email || userId;
  }, [userId, members]);

  const selectedActionLabel = useMemo(() => {
    if (!actionId) return "Select action";
    const action = actions.find((a) => a.id === actionId);
    return action ? `[${action.competency.key}] ${action.title}` : "Select action";
  }, [actionId, actions]);

  async function assign() {
    if (!userId || !actionId) {
      toast.error("Choose a person and an action");
      return;
    }
    setBusy(true);
    try {
      await orgManualAssignAction({ slug, targetUserId: userId, actionId });
      toast.success("Assigned");
      setActionId("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    if (!dismissId || !dismissReason.trim()) return;
    setBusy(true);
    try {
      await orgDismissUserAction({ slug, userActionId: dismissId, reason: dismissReason.trim() });
      toast.success("Dismissed");
      setDismissId("");
      setDismissReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Manual assign</CardTitle>
          <CardDescription>Assign a catalog action for the current week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Team member</Label>
            <Select value={userId || undefined} onValueChange={(v) => setUserId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select user">
                  {selectedUserLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.user.name?.trim() || m.user.email || m.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={actionId || undefined} onValueChange={(v) => setActionId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select action">
                  {selectedActionLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {actions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    [{a.competency.key}] {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={busy} onClick={() => void assign()}>
            Assign
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dismiss assignment</CardTitle>
          <CardDescription>Record a reason when closing an open action for someone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>User action ID</Label>
            <Input
              value={dismissId}
              onChange={(e) => setDismissId(e.target.value)}
              placeholder="Paste ID from table"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} />
          </div>
          <Button variant="secondary" disabled={busy} onClick={() => void dismiss()}>
            Dismiss
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAssignments.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.user.name ?? r.user.email}</TableCell>
                  <TableCell>{r.action.title}</TableCell>
                  <TableCell>{r.weekKey}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
