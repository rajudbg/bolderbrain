import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import type { TenantClaim } from "@/types/tenant";
import {
  TENANT_ID_HEADER,
  TENANT_ORG_ID_HEADER,
  TENANT_ROLE_HEADER,
  TENANT_SLUG_HEADER,
} from "@/lib/tenant";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/tenant")) {
    return NextResponse.next();
  }

  const slug = req.headers.get(TENANT_SLUG_HEADER);
  const orgIdHeader = req.headers.get(TENANT_ID_HEADER);

  if (!slug && !orgIdHeader) {
    return NextResponse.json(
      { error: "Missing tenant: set x-organization-slug or x-organization-id" },
      { status: 400 },
    );
  }

  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants: TenantClaim[] = req.auth.user.tenants ?? [];
  const match = tenants.find(
    (t) => (slug && t.slug === slug) || (orgIdHeader && t.organizationId === orgIdHeader),
  );

  if (!match) {
    return NextResponse.json({ error: "Forbidden: not a member of this organization" }, { status: 403 });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(TENANT_ORG_ID_HEADER, match.organizationId);
  requestHeaders.set(TENANT_ROLE_HEADER, match.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: ["/api/tenant/:path*"],
};
