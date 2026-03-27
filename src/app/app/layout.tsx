import { auth } from "@/auth";
import { listAdminTenants } from "@/lib/admin/context";
import { redirect } from "next/navigation";
import { AppShell } from "./_components/app-shell";

export default async function EmployeeAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/app/dashboard");
  }

  const showAdminLink = listAdminTenants(session.user.tenants).length > 0;

  return (
    <AppShell
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
      showAdminLink={showAdminLink}
    >
      {children}
    </AppShell>
  );
}
