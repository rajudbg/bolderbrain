import type { Metadata } from "next";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { SuperAdminNav } from "./_components/super-admin-nav";

export const metadata: Metadata = {
  title: "Super Admin · BolderBrain",
  description: "Platform administration",
};

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformSuperAdmin();
  return (
    <div className="flex min-h-screen bg-[#0F0F11] text-white/90">
      <aside className="border-border w-72 shrink-0 border-r border-white/[0.05] bg-[#0F0F11]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-6">
        <SuperAdminNav />
      </aside>
      <main className="min-w-0 flex-1 p-4 pl-6 pr-4 md:p-8 md:pl-10 md:pr-8">{children}</main>
    </div>
  );
}
