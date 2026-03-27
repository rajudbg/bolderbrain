"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization, deleteOrganization, updateOrganization } from "../../actions";

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export function OrganizationsTable({ organizations }: { organizations: OrganizationRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<OrganizationRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<OrganizationRow | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    try {
      await createOrganization({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
      });
      toast.success("Organization created");
      setCreateOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setPending(false);
    }
  }

  async function handleEdit(formData: FormData) {
    if (!editRow) return;
    setPending(true);
    try {
      await updateOrganization({
        id: editRow.id,
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
      });
      toast.success("Organization updated");
      setEditRow(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteRow) return;
    setPending(true);
    try {
      await deleteOrganization(deleteRow.id);
      toast.success("Organization deleted");
      setDeleteRow(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New organization
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-white/45">
                  No organizations yet.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium text-white/90">{org.name}</TableCell>
                  <TableCell>
                    <code className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-white/70">
                      {org.slug}
                    </code>
                  </TableCell>
                  <TableCell className="hidden text-white/50 sm:table-cell">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(org.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex justify-end gap-0.5 rounded-lg bg-white/[0.05] p-1 opacity-90 transition-opacity hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        className="text-white/40 hover:bg-transparent hover:text-white/90"
                        onClick={() => setEditRow(org)}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        className="text-rose-400/60 hover:bg-transparent hover:text-rose-400"
                        onClick={() => setDeleteRow(org)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleCreate(new FormData(e.currentTarget));
            }}
          >
            <DialogHeader>
              <DialogTitle>Create organization</DialogTitle>
              <DialogDescription>Slug is used in URLs and must be unique (lowercase, hyphens).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name</Label>
                <Input id="create-name" name="name" required placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug</Label>
                <Input id="create-slug" name="slug" required placeholder="acme-corp" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          {editRow && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleEdit(new FormData(e.currentTarget));
              }}
            >
              <DialogHeader>
                <DialogTitle>Edit organization</DialogTitle>
                <DialogDescription>Updating {editRow.name}.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" name="name" required defaultValue={editRow.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input id="edit-slug" name="slug" required defaultValue={editRow.slug} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteRow?.name}</strong> and all related competencies and questions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={pending} onClick={() => void handleDelete()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
