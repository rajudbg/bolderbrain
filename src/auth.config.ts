import type { NextAuthConfig } from "next-auth";
import type { TenantClaim } from "@/types/tenant";

/**
 * Shared Auth.js settings (no DB imports) so Edge middleware can import this file
 * without bundling Prisma or `pg`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if ("tenants" in user && Array.isArray((user as { tenants?: TenantClaim[] }).tenants)) {
          token.tenants = (user as { tenants: TenantClaim[] }).tenants;
        }
        if ("isPlatformSuperAdmin" in user) {
          token.isPlatformSuperAdmin = Boolean(
            (user as { isPlatformSuperAdmin?: boolean }).isPlatformSuperAdmin,
          );
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.tenants = (token.tenants as TenantClaim[] | undefined) ?? [];
        session.user.isPlatformSuperAdmin = Boolean(token.isPlatformSuperAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
