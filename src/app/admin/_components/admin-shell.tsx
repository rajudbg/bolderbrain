"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Building2,
  Download,
  GraduationCap,
  Heart,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Menu,
  Presentation,
  Target,
  Users,
  Flame,
  Grid3x3,
  CircleUser,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminAiCoachChat } from "@/components/ai/admin-ai-coach-chat";
import { cn } from "@/lib/utils";
import { setAdminOrgSlugCookie } from "../org-actions";

const navGroups = [
  {
    label: "Intelligence",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/competencies", label: "Competencies", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/people", label: "People", icon: Building2 },
      { href: "/admin/talent", label: "Talent & risk", icon: Target },
      { href: "/admin/team/development", label: "Team dev", icon: Grid3x3 },
    ],
  },
  {
    label: "Assessments",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Users },
      { href: "/admin/feedback-360", label: "360 feedback", icon: Users },
      { href: "/admin/assessment-programs", label: "Programs", icon: LayoutGrid },
      { href: "/app/assessments/eq", label: "EQ", icon: Heart },
    ],
  },
  {
    label: "Development",
    items: [
      { href: "/admin/tna", label: "TNA", icon: Flame },
      { href: "/admin/training", label: "Training Impact", icon: GraduationCap },
      { href: "/admin/action-center", label: "Action center", icon: Target },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Download },
      { href: "/admin/usage", label: "Usage", icon: BarChart3 },
      { href: "/admin/profile", label: "Profile", icon: CircleUser },
    ],
  },
];

export function AdminShell({
  organizations,
  currentOrganizationId,
  userName,
  userEmail,
  children,
}: {
  organizations: { id: string; name: string; slug: string }[];
  currentOrganizationId: string;
  userName: string | null;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [presentation, setPresentation] = useState(false);

  const selectedOrgName = useMemo(() => {
    const org = organizations.find((o) => o.id === currentOrganizationId);
    return org?.name ?? organizations[0]?.name ?? "Select org";
  }, [currentOrganizationId, organizations]);

  // Shared handler that closes the mobile sheet menu
  const closeSheet = () => setOpen(false);

  useEffect(() => {
    document.documentElement.classList.toggle("admin-presentation", presentation);
    return () => document.documentElement.classList.remove("admin-presentation");
  }, [presentation]);

  async function onOrgChange(slug: string) {
    closeSheet();
    await setAdminOrgSlugCookie(slug);
  }

  return (
    <>
      <div className="min-h-screen bg-[#0F0F11] text-white/90">
      <aside className="admin-chrome border-border/60 fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.05] bg-[#0F0F11]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:flex">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
          <Link href="/admin" className="font-heading text-lg font-semibold tracking-tight text-gradient-heading">
            HR Intelligence
          </Link>
        </div>
        <div className="border-b border-white/[0.06] px-3 py-3">
          <p className="text-caption-cerebral mb-1 px-1">Organization</p>
          <Select
            value={
              organizations.find((o) => o.id === currentOrganizationId)?.slug ??
              organizations[0]?.slug ??
              ""
            }
            onValueChange={(v) => {
              if (v) void onOrgChange(v);
            }}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-left text-sm text-white/90 backdrop-blur-md">
              <SelectValue placeholder="Select org">
                {selectedOrgName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.slug}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
          <nav className="flex flex-col gap-6 px-2 py-4">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">{group.label}</p>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "focus-visible:ring-purple-500/50 flex items-center gap-3 rounded-r-xl border-l-2 py-2.5 pr-3 pl-3 text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none",
                        active
                          ? "border-indigo-500 bg-white/5 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                          : "border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/80",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-indigo-400" : "text-white/40")} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        <div className="space-y-2 border-t border-white/[0.06] p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-white/10"
            type="button"
            onClick={() => setPresentation((p) => !p)}
          >
            <Presentation className="size-4" />
            {presentation ? "Exit presentation" : "Presentation mode"}
          </Button>
          <Link
            href="/app/dashboard"
            className="block text-center text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
          >
            Employee app
          </Link>
          <p className="truncate text-xs text-white/50">
            {userName || "User"}
            {userEmail ? <span className="block text-[10px] text-white/40">{userEmail}</span> : null}
          </p>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-white/10"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="admin-chrome sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-[#0F0F11]/75 px-4 shadow-sm backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-white/80"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <SheetContent side="left" className="w-72 border-white/10 bg-[#1A1A1E]/95 p-0 backdrop-blur-xl">
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <span className="font-heading font-semibold text-white">HR Intelligence</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white"
                  type="button"
                  onClick={closeSheet}
                  aria-label="Close menu"
                >
                  Close
                </Button>
              </div>
              <div className="p-3">
                <p className="text-caption-cerebral mb-2 px-3 text-xs">Organization</p>
                <div className="px-2 pb-3">
                  <Select
                    value={
                      organizations.find((o) => o.id === currentOrganizationId)?.slug ??
                      organizations[0]?.slug ??
                      ""
                    }
                    onValueChange={(v) => {
                      if (v) void onOrgChange(v);
                    }}
                  >
                    <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-left text-sm text-white/90 backdrop-blur-md">
                      <SelectValue placeholder="Select org" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((o) => (
                        <SelectItem key={o.id} value={o.slug}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <nav className="flex flex-col gap-6 px-2">
                  {navGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">{group.label}</p>
                      {group.items.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeSheet}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06]"
                        >
                          <Icon className="size-4" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>
              <div className="space-y-2 border-t border-white/10 p-4">
                <p className="truncate text-xs text-white/50">
                  {userName || "User"}
                  {userEmail ? <span className="block text-[10px] text-white/40">{userEmail}</span> : null}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  type="button"
                  onClick={() => {
                    closeSheet();
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-caption-cerebral normal-case">Admin</span>
        </header>

        {/* Content area -- responsive padding, extra bottom room on small screens */}
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-8 sm:px-6 sm:pb-10 md:px-10 md:pb-12 lg:px-12 lg:pb-10">
          {children}
        </div>
      </div>
      <AdminAiCoachChat />
    </div>

      <style jsx global>{`
        html.admin-presentation .admin-chrome {
          display: none !important;
        }
        html.admin-presentation .lg\\:pl-72 {
          padding-left: 0 !important;
        }
      `}</style>
    </>
  );
}