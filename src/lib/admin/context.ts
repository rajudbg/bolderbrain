import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { TenantClaim } from "@/types/tenant";

export const ADMIN_ORG_COOKIE = "admin-org-slug";

export function listAdminTenants(tenants: TenantClaim[] | undefined): TenantClaim[] {
  return (tenants ?? []).filter((t) => t.role === "ADMIN" || t.role === "SUPER_ADMIN");
}

/** Resolves organization id for HR admin routes (cookie override or first admin org). */
export async function resolveAdminOrganizationId(): Promise<string | null> {
  const session = await auth();
  const adminOrgs = listAdminTenants(session?.user?.tenants);
  if (adminOrgs.length === 0) return null;
  const store = await cookies();
  const slug = store.get(ADMIN_ORG_COOKIE)?.value;
  const match = slug ? adminOrgs.find((t) => t.slug === slug) : undefined;
  return (match ?? adminOrgs[0]).organizationId;
}

export async function requireAdminOrganizationId(): Promise<string> {
  const id = await resolveAdminOrganizationId();
  if (!id) redirect("/app");
  return id;
}
