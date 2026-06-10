// @ts-nocheck
/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { updateMemberDepartment, updateMemberRole, setUserActive, getEmployeeDrawerDetails } from "@/app/admin/hr-actions";
import type { PeopleRow } from "@/lib/admin/queries";
import { OrganizationRole } from "@/generated/prisma/enums";

export function PeopleTable({ rows }: { rows: PeopleRow[] }) {
  const [q, setQ] = useState("");
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.email ?? "").toLowerCase().includes(s) ||
        (r.name ?? "").toLowerCase().includes(s) ||
        (r.department ?? "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/35" aria-hidden />
        <Input
          className="border-white/10 bg-white/[0.04] pl-10 pr-3 text-white/90 placeholder:text-white/30"
          placeholder="Search name, email, department…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.userId}>
                <TableCell className="font-medium text-white/90">{r.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-white/50">{r.email}</TableCell>
                <TableCell>
                  <DepartmentEditor userId={r.userId} initial={r.department ?? ""} />
                </TableCell>
                <TableCell>
                  <RoleSelect userId={r.userId} initial={r.role} />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant={r.isActive ? "outline" : "secondary"}
                    onClick={async () => {
                      try {
                        await setUserActive(r.userId, !r.isActive);
                        toast.success(r.isActive ? "User deactivated" : "User reactivated");
                        window.location.reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                  >
                    {r.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setDrawerUserId(r.userId)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {drawerUserId && (
        <EmployeeDrawer userId={drawerUserId} open={!!drawerUserId} onOpenChange={(open) => !open && setDrawerUserId(null)} />
      )}
    </div>
  );
}

function DepartmentEditor({ userId, initial }: { userId: string; initial: string }) {
  const [v, setV] = useState(initial);
  return (
    <form
      className="flex gap-1"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await updateMemberDepartment(userId, v.trim() || null);
          toast.success("Department saved");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        }
      }}
    >
      <Input className="h-8 max-w-[180px] text-xs" value={v} onChange={(e) => setV(e.target.value)} />
      <Button type="submit" size="sm" variant="secondary" className="h-8">
        Save
      </Button>
    </form>
  );
}

function RoleSelect({ userId, initial }: { userId: string; initial: OrganizationRole }) {
  const [role, setRole] = useState(initial);

  const selectedRoleLabel = useMemo(() => {
    if (role === OrganizationRole.EMPLOYEE) return "Employee";
    if (role === OrganizationRole.ADMIN) return "Admin";
    if (role === OrganizationRole.SUPER_ADMIN) return "Org super admin";
    return role;
  }, [role]);

  return (
    <Select
      value={role}
      onValueChange={async (val) => {
        const next = val as OrganizationRole;
        setRole(next);
        try {
          await updateMemberRole(userId, next);
          toast.success("Role updated");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
          setRole(initial);
        }
      }}
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue>
          {selectedRoleLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={OrganizationRole.EMPLOYEE}>Employee</SelectItem>
        <SelectItem value={OrganizationRole.ADMIN}>Admin</SelectItem>
        <SelectItem value={OrganizationRole.SUPER_ADMIN}>Org super admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

function EmployeeDrawer({ userId, open, onOpenChange }: { userId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getEmployeeDrawerDetails>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getEmployeeDrawerDetails(userId)
        .then(setDetails)
        .catch((e) => toast.error(e.message))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [open, userId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-[#0A0A0E] border-white/10 text-white/90">
        {loading || !details ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-white/50 text-sm">Loading details...</span>
          </div>
        ) : (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white/90 text-xl">{details.user.name ?? "Employee"}</SheetTitle>
              <SheetDescription className="text-white/50">
                {details.user.email} • {details.user.department ?? "No department"}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-8">
              {/* 360 Status */}
              <div>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Latest 360 Status</h4>
                {details.latest360 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="font-medium text-white/90">{details.latest360.name}</p>
                    <p className="text-sm text-white/50 mt-1">Status: {details.latest360.status}</p>
                    <p className="text-sm text-white/50">Updated: {new Date(details.latest360.updatedAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-white/30">No 360 assessment found.</p>
                )}
              </div>

              {/* Competencies */}
              <div>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Competency Averages</h4>
                {details.competencies.length > 0 ? (
                  <div className="space-y-3">
                    {details.competencies.map((c) => (
                      <div key={c.key} className="flex items-center justify-between">
                        <span className="text-sm text-white/80">{c.key}</span>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${(c.score / 5) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium w-8 text-right text-white/90">{c.score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30">No competency data available.</p>
                )}
              </div>

              {/* Active Actions */}
              <div>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Active Development</h4>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-2xl font-semibold text-white/90">{details.activeActionsCount}</p>
                  <p className="text-sm text-white/50 mt-1">actions currently assigned or in progress</p>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
