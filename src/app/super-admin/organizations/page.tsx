import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { OrganizationsTable } from "./_components/organizations-table";

export default async function OrganizationsPage() {
  await requirePlatformSuperAdmin();
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-sm">Create and manage tenants (slug must stay URL-safe).</p>
      </div>
      <OrganizationsTable organizations={organizations} />
    </div>
  );
}
