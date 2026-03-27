import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { listAdminTenants, resolveAdminOrganizationId } from "@/lib/admin/context";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const adminTenants = listAdminTenants(session.user.tenants);
  if (adminTenants.length === 0) {
    redirect("/app");
  }

  const orgId = await resolveAdminOrganizationId();
  if (!orgId) {
    redirect("/app");
  }

  const orgRows = await prisma.organization.findMany({
    where: { id: { in: adminTenants.map((t) => t.organizationId) } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const current = orgRows.find((o) => o.id === orgId) ?? orgRows[0]!;

  return (
    <AdminShell
      organizations={orgRows}
      currentOrganizationId={current.id}
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
    >
      {children}
    </AdminShell>
  );
}
