import type { Metadata } from "next";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { SuperAdminNav } from "./_components/super-admin-nav";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = {
  title: "Super Admin · BolderBrain",
  description: "Platform administration",
};

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformSuperAdmin();
  return (
    <div className="min-h-screen bg-[#0F0F11] text-white/90">
      {/* Desktop sidebar */}
      <aside className="border-border/60 fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.05] bg-[#0F0F11]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:flex">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
          <span className="font-heading text-lg font-semibold tracking-tight text-gradient-heading">
            BolderBrain
          </span>
        </div>
        <div className="flex flex-1 flex-col px-3 py-4">
          <p className="text-caption-cerebral mb-2 px-3">Navigate</p>
          <SuperAdminNav />
        </div>
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <SignOutButton />
        </div>
      </aside>

      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-[#0F0F11]/75 px-4 shadow-sm backdrop-blur-md lg:hidden">
          <span className="text-caption-cerebral normal-case">Super Admin</span>
        </header>
        
        {/* Main content */}
        <main className="mx-auto max-w-[1600px] px-4 py-8 pl-6 pr-4 md:pl-10 md:pr-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
