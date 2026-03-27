"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createAction,
  createCompetency,
  deleteAction,
  deleteCompetency,
  listActionsForCompetency,
  listCompetenciesForOrg,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Org = { id: string; name: string; slug: string };
type CompetencyRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { actions: number };
};
type ActionRow = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  sortOrder: number;
};

/** Keeps competency Select controlled before data loads (never `value={undefined}`). */
const EMPTY_COMPETENCY = "__dev_comp_none__" as const;

export function DevelopmentClient({
  organizations,
  initialOrgId,
}: {
  organizations: Org[];
  initialOrgId: string | null;
}) {
  const [orgId, setOrgId] = useState(initialOrgId ?? organizations[0]?.id ?? "");
  const [competencies, setCompetencies] = useState<CompetencyRow[]>([]);
  const [competencyId, setCompetencyId] = useState<string>("");
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedComp = useMemo(() => competencies.find((c) => c.id === competencyId), [competencies, competencyId]);

  async function refreshCompetencies() {
    if (!orgId) return;
    setLoading(true);
    try {
      const rows = await listCompetenciesForOrg(orgId);
      setCompetencies(rows as CompetencyRow[]);
      setCompetencyId((id) => {
        if (id && rows.some((r: CompetencyRow) => r.id === id)) return id;
        return rows[0]?.id ?? "";
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function refreshActions(cid: string) {
    if (!cid) {
      setActions([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await listActionsForCompetency(cid);
      setActions(rows as ActionRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshCompetencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when org changes only
  }, [orgId]);

  useEffect(() => {
    void refreshActions(competencyId);
  }, [competencyId]);

  const competencySelectItems = useMemo(
    () => [
      { value: EMPTY_COMPETENCY, label: "Select competency" },
      ...competencies.map((c) => ({ value: c.id, label: `${c.name} (${c.key})` })),
    ],
    [competencies],
  );

  async function onCreateCompetency(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createCompetency({
        organizationId: orgId,
        key: String(fd.get("key") ?? ""),
        name: String(fd.get("name") ?? ""),
        description: String(fd.get("description") ?? "") || undefined,
        sortOrder: Number(fd.get("sortOrder") ?? 0),
      });
      toast.success("Competency created");
      e.currentTarget.reset();
      await refreshCompetencies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onCreateAction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!competencyId) {
      toast.error("Select a competency");
      return;
    }
    const fd = new FormData(e.currentTarget);
    try {
      await createAction({
        competencyId,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        difficulty: String(fd.get("difficulty") ?? "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
        estimatedTime: Number(fd.get("estimatedTime") ?? 30),
        sortOrder: Number(fd.get("sortOrder") ?? 0),
      });
      toast.success("Action created");
      e.currentTarget.reset();
      await refreshActions(competencyId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/55">
        No organizations yet. Create one in{" "}
        <Link href="/super-admin/organizations" className="text-amber-200/90 underline underline-offset-2 hover:text-amber-100">
          Organizations
        </Link>{" "}
        before managing the development library.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label>Organization</Label>
        <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")} items={organizations.map((o) => ({ value: o.id, label: o.name }))}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Competency <code className="text-foreground">key</code> should match 360 question competency / trait
          labels.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Competencies</CardTitle>
            <CardDescription>Group development actions by competency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onCreateCompetency} className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="c-key">Key</Label>
                  <Input id="c-key" name="key" required placeholder="Communication" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-name">Name</Label>
                  <Input id="c-name" name="name" required placeholder="Communication" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-desc">Description</Label>
                <Textarea id="c-desc" name="description" rows={2} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-sort">Sort</Label>
                <Input id="c-sort" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <Button type="submit" size="sm" disabled={!orgId || loading}>
                Add competency
              </Button>
            </form>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.key}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c._count.actions}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={async () => {
                            if (!confirm("Delete competency and its actions?")) return;
                            await deleteCompetency(c.id);
                            toast.success("Deleted");
                            await refreshCompetencies();
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Select a competency, then add concrete behaviors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Competency</Label>
              <Select
                value={competencyId || EMPTY_COMPETENCY}
                onValueChange={(v) => setCompetencyId(v === EMPTY_COMPETENCY ? "" : (v ?? ""))}
                items={competencySelectItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select competency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_COMPETENCY}>Select competency</SelectItem>
                  {competencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedComp && (
              <form onSubmit={onCreateAction} className="grid gap-3">
                <div className="space-y-1">
                  <Label htmlFor="a-title">Title</Label>
                  <Input id="a-title" name="title" required placeholder="Practice active listening…" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="a-desc">Description</Label>
                  <Textarea
                    id="a-desc"
                    name="description"
                    required
                    rows={5}
                    placeholder="What to do, when, and how you&apos;ll know it worked."
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="a-diff">Difficulty</Label>
                    <select
                      id="a-diff"
                      name="difficulty"
                      defaultValue="MEDIUM"
                      className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="a-time">Est. minutes</Label>
                    <Input id="a-time" name="estimatedTime" type="number" defaultValue={30} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="a-sort">Sort</Label>
                    <Input id="a-sort" name="sortOrder" type="number" defaultValue={0} />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={loading}>
                  Add action
                </Button>
              </form>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-[240px]">
                        <p className="font-medium">{a.title}</p>
                        <p className="text-muted-foreground line-clamp-2 text-xs">{a.description}</p>
                      </TableCell>
                      <TableCell>{a.difficulty}</TableCell>
                      <TableCell>{a.estimatedTime}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={async () => {
                            if (!confirm("Delete this action?")) return;
                            await deleteAction(a.id);
                            toast.success("Deleted");
                            await refreshActions(competencyId);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
