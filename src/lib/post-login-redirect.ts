import type { Session } from "next-auth";

/** True if user can open HR admin for at least one org (tenant ADMIN or SUPER_ADMIN). */
export function hasOrgAdminRole(session: Session | null): boolean {
  const tenants = session?.user?.tenants ?? [];
  return tenants.some((t) => t.role === "ADMIN" || t.role === "SUPER_ADMIN");
}

/**
 * Default landing path after sign-in when no callbackUrl applies.
 * Order: platform super admin → HR admin → employee dashboard.
 */
export function getDefaultPostLoginPath(session: Session | null): string {
  if (!session?.user) return "/";
  if (session.user.isPlatformSuperAdmin) return "/super-admin";
  if (hasOrgAdminRole(session)) return "/admin";
  return "/app/dashboard";
}
