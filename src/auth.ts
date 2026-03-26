import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import prisma from "./lib/prisma";
import type { TenantClaim } from "@/types/tenant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email as string;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
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
        };
      },
    }),
  ],
});
