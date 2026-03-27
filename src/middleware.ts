import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { checkRateLimit } from "@/lib/api-rate-limit";
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

  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/health")
  ) {
    const userId = req.auth?.user?.id;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
    const key = userId ? `u:${userId}` : `ip:${ip ?? "unknown"}`;
    if (!checkRateLimit(`api:${key}`, 100, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    const tenants: TenantClaim[] = req.auth.user.tenants ?? [];
    const canAdmin = tenants.some((t) => t.role === "ADMIN" || t.role === "SUPER_ADMIN");
    if (!canAdmin) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/super-admin")) {
    if (!req.auth?.user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    const isPlatformSuperAdmin = Boolean(
      (req.auth.user as { isPlatformSuperAdmin?: boolean }).isPlatformSuperAdmin,
    );
    if (!isPlatformSuperAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/app") || pathname.startsWith("/assessments") || pathname.startsWith("/org")) {
    if (!req.auth?.user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

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
  matcher: [
    "/api/:path*",
    "/api/tenant/:path*",
    "/admin",
    "/admin/:path*",
    "/super-admin",
    "/super-admin/:path*",
    "/app",
    "/app/:path*",
    "/assessments",
    "/assessments/:path*",
    "/org/:path*",
  ],
};
