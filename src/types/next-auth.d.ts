import type { DefaultSession } from "next-auth";
import type { TenantClaim } from "@/types/tenant";

declare module "next-auth" {
  interface User {
    tenants?: TenantClaim[];
  }

  interface Session {
    user: {
      id: string;
      tenants: TenantClaim[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenants?: TenantClaim[];
  }
}
