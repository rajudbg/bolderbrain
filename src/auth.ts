import { CredentialsSignin } from "@auth/core/errors";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { checkLoginRateLimit } from "./lib/login-rate-limit";
import prisma from "./lib/prisma";
import type { TenantClaim } from "@/types/tenant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    /**
     * PrismaAdapter + Credentials can drop custom `user.tenants` before the JWT is minted.
     * Always load org memberships from DB so `tenants` (and ADMIN vs EMPLOYEE) are in the JWT.
     */
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
      if (token.sub) {
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: token.sub },
          include: { organization: { select: { slug: true } } },
        });
        token.tenants = memberships.map((m) => ({
          organizationId: m.organizationId,
          slug: m.organization.slug,
          role: m.role,
        })) as TenantClaim[];
      }
      return token;
    },
    session: authConfig.callbacks!.session,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers?.get("x-real-ip") ??
          "unknown";
        if (!checkLoginRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
          const err = new CredentialsSignin();
          err.code = "rate_limit";
          throw err;
        }
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email as string;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          return null;
        }
        if (user.isActive === false) {
          return null;
        }
        const ok = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!ok) {
          return null;
        }
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: user.id },
          include: { organization: { select: { id: true, slug: true } } },
        });
        const tenants: TenantClaim[] = memberships.map((m) => ({
          organizationId: m.organizationId,
          slug: m.organization.slug,
          role: m.role,
        }));
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenants,
          isPlatformSuperAdmin: user.isPlatformSuperAdmin,
        };
      },
    }),
  ],
});
