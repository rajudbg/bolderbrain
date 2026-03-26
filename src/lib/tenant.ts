import { headers } from "next/headers";
import type { TenantClaim } from "@/types/tenant";

/** Set by middleware for `/api/tenant/*` after membership checks. */
export const TENANT_ORG_ID_HEADER = "x-tenant-organization-id";
export const TENANT_ROLE_HEADER = "x-tenant-role";

/** Request headers the client must send for tenant-scoped API routes. */
export const TENANT_SLUG_HEADER = "x-organization-slug";
export const TENANT_ID_HEADER = "x-organization-id";

export type ResolvedTenantContext = {
  organizationId: string;
  role: TenantClaim["role"];
};

/**
 * Read tenant context from Next.js headers (set by middleware on `/api/tenant/*`).
 * Use in Route Handlers / Server Actions after middleware has run.
 */
export async function getTenantContextFromHeaders(): Promise<ResolvedTenantContext | null> {
  const h = await headers();
  const organizationId = h.get(TENANT_ORG_ID_HEADER);
  const role = h.get(TENANT_ROLE_HEADER) as TenantClaim["role"] | null;
  if (!organizationId || !role) {
    return null;
  }
  return { organizationId, role };
}

/**
 * Build Prisma `where` helpers for org-scoped models (defense in depth with middleware).
 */
export function scopeToOrganization(organizationId: string): { organizationId: string } {
  return { organizationId };
}
