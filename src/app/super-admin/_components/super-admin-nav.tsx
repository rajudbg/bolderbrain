"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookMarked, Building2, ClipboardList, HelpCircle, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/super-admin", label: "Overview", icon: LayoutDashboard },
  { href: "/super-admin/ai-health", label: "AI health", icon: Activity },
  { href: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/super-admin/templates", label: "Assessment templates", icon: ClipboardList },
  { href: "/super-admin/templates/content/new", label: "Training content", icon: BookMarked },
  { href: "/super-admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/super-admin/development", label: "Development", icon: Sparkles },
];

export function SuperAdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-caption-cerebral">BolderBrain</p>
        <h1 className="font-heading mt-1 text-lg font-semibold tracking-tight text-white/95">Super Admin</h1>
      </div>
      <p className="text-caption-cerebral mt-2 mb-2 px-1 text-[10px] text-white/30">Navigate</p>
      <nav className="flex flex-col gap-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const activeResolved =
            href === "/super-admin"
              ? pathname === "/super-admin"
              : href === "/super-admin/templates/content/new"
                ? pathname.startsWith("/super-admin/templates/content")
                : href === "/super-admin/templates"
                  ? pathname.startsWith("/super-admin/templates") && !pathname.startsWith("/super-admin/templates/content")
                  : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "focus-visible:ring-purple-500/50 flex items-center gap-2 rounded-r-xl border-l-2 py-2.5 pr-3 pl-3 text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none",
                activeResolved
                  ? "border-indigo-500 bg-white/5 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                  : "border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/80",
              )}
            >
              <Icon className={cn("size-4 shrink-0", activeResolved ? "text-indigo-400" : "text-white/40")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/[0.08] pt-4">
        <SignOutButton />
      </div>
    </div>
  );
}
