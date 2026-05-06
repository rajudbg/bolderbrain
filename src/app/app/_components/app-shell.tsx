"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  LogOut,
  Menu,
  Target,
  Brain,
  Heart,
  Sparkles,
  Briefcase,
  MoreHorizontal,
  GraduationCap,
  Users,
  Flame,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AiCoachChat } from "@/components/ai/ai-coach-chat";
import { NotificationBell } from "@/components/notifications/notification-bell";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/manager", label: "My team", icon: Users },
  { href: "/app/actions", label: "My actions", icon: Target },
  { href: "/app/training", label: "My learning", icon: GraduationCap },
  { href: "/app/development", label: "Development", icon: Flame },
  { href: "/assessments", label: "My assessments", icon: ClipboardList },
  { href: "/app/assessments/iq", label: "Cognitive (IQ)", icon: Brain },
  { href: "/app/assessments/eq", label: "EQ", icon: Heart },
  { href: "/app/assessments/psychometric", label: "Personality", icon: Sparkles },
  { href: "/app/profile", label: "Profile", icon: User },
];

const adminNavItem = { href: "/admin", label: "HR admin", icon: Briefcase };

const dockItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assessments", label: "Assess", icon: ClipboardList },
  { href: "/app/actions", label: "Actions", icon: Target },
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/app/dashboard") {
    return pathname === "/app" || pathname === "/app/dashboard";
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  if (href === "/app/actions") {
    return pathname === "/app/actions" || pathname.startsWith("/app/actions/");
  }
  if (href === "/app/training") {
    return pathname === "/app/training" || pathname.startsWith("/app/training/");
  }
  if (href === "/app/development") {
    return pathname === "/app/development" || pathname.startsWith("/app/development/");
  }
  if (href === "/app/assessments/iq") {
    return pathname === "/app/assessments/iq" || pathname.startsWith("/app/assessments/iq/");
  }
  if (href === "/app/assessments/eq") {
    return pathname === "/app/assessments/eq" || pathname.startsWith("/app/assessments/eq/");
  }
  if (href === "/app/assessments/psychometric") {
    return pathname === "/app/assessments/psychometric" || pathname.startsWith("/app/assessments/psychometric/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  onNavigate,
  className,
  showAdminLink,
}: {
  onNavigate?: () => void;
  className?: string;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const items = showAdminLink ? [...nav, adminNavItem] : nav;
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = navActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
    </nav>
  );
}

export function AppShell({
  userName,
  userEmail,
  showAdminLink = false,
  children,
}: {
  userName: string | null;
  userEmail: string | null;
  showAdminLink?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white/90">
      {/* Desktop command bar -- glass sidebar */}
      <aside className="border-border/60 fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.05] bg-[#0F0F11]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0F0F11]/75 lg:flex">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
          <Link href="/app/dashboard" className="font-heading text-lg font-semibold tracking-tight text-gradient-heading">
            BolderBrain
          </Link>
        </div>
        <div className="flex flex-1 flex-col px-3 py-4">
          <p className="text-caption-cerebral mb-2 px-3">Navigate</p>
          <NavLinks showAdminLink={showAdminLink} />
        </div>
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <p className="truncate text-xs text-white/50">
              {userName || "User"}
              {userEmail ? <span className="block text-[10px] text-white/40">{userEmail}</span> : null}
            </p>
            <NotificationBell />
          </div>
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-[#0F0F11]/70 px-4 shadow-sm backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-white/80"
              aria-label="Open menu"
              type="button"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <SheetContent side="left" className="w-72 border-white/10 bg-[#1A1A1E]/95 p-0 backdrop-blur-xl">
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <span className="font-heading font-semibold text-white">Menu</span>
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
                <nav className="flex flex-col gap-1">
                  {(showAdminLink ? [...nav, adminNavItem] : nav).map(({ href, label, icon: Icon }) => {
                    const active = navActive(pathname, href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeSheet}
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
          <span className="text-caption-cerebral ml-1 normal-case">Employee</span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        {/* Content area — extra bottom padding on mobile so dock doesn't overlap content */}
        <div
          className="pb-28 pl-4 pr-4 pt-5 transition-opacity duration-300 sm:pl-6 sm:pr-5 md:pl-8 md:pr-6 lg:pb-10 lg:pl-10 lg:pr-8"
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </div>
      </div>

      {/* Mobile floating dock -- always-visible quick actions */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
        aria-label="Quick navigation"
      >
        <div className="flex justify-center px-4 pt-3">
          <div className="flex max-w-sm items-center justify-center gap-1 rounded-2xl border border-white/10 bg-[#1A1A1E]/95 px-1.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl">
            {dockItems.map(({ href, label, icon: Icon }) => {
              const active = navActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200 active:scale-95",
                    active
                      ? "bg-white/[0.08] text-white shadow-[0_0_16px_rgba(99,102,241,0.2)]"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 stroke-[1.75] transition-colors",
                      active ? "text-indigo-400" : "text-white/35",
                    )}
                  />
                  <span className="leading-none">{label}</span>
                </Link>
              );
            })}

            {/* "More" button -- opens the sheet menu */}
            <button
              type="button"
              className="flex min-w-[4rem] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium text-white/45 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/75 active:scale-95"
              onClick={() => setOpen(true)}
              aria-label="More options"
            >
              <MoreHorizontal className="size-5 shrink-0 stroke-[1.75] text-white/35" />
              <span className="leading-none">More</span>
            </button>
          </div>
        </div>
      </nav>
      {/* AI Coach floating chat — available on all employee pages */}
      <AiCoachChat />
    </div>
  );
}