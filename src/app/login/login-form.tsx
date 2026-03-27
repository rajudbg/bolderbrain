"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDefaultPostLoginPath } from "@/lib/post-login-redirect";
import { cn } from "@/lib/utils";

/** After credentials sign-in, client `getSession()` is often stale (missing tenants). Read from API with backoff. */
async function readSessionAfterSignIn(): Promise<Session | null> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const r = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
    if (!r.ok) {
      await new Promise((res) => setTimeout(res, 40 * (attempt + 1)));
      continue;
    }
    const data = (await r.json()) as Session | null;
    if (data?.user?.id) return data;
    await new Promise((res) => setTimeout(res, 40 * (attempt + 1)));
  }
  return null;
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const portal = searchParams.get("portal");
  const { data: session, status } = useSession();

  const variant = useMemo(() => {
    if (portal === "organization") return "organization" as const;
    if (portal === "employees") return "employees" as const;
    if (portal === "super") return "super" as const;
    return "default" as const;
  }, [portal]);

  /** Already signed in as platform super admin — skip the form (stable home link always points here). */
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isPlatformSuperAdmin) return;
    const raw = callbackUrlParam?.trim() ?? "";
    if (!raw.startsWith("/super-admin") || !isSafeInternalPath(raw)) return;
    router.replace(raw);
    router.refresh();
  }, [status, session?.user?.isPlatformSuperAdmin, callbackUrlParam, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const title =
    variant === "organization"
      ? "Organization Admin"
      : variant === "employees"
        ? "Employee Portal"
        : variant === "super"
          ? "Platform Super Admin"
          : "Sign in";

  const description =
    variant === "organization"
      ? "HR and people leaders — access your organization command center."
      : variant === "employees"
        ? "Assessments, profile, and growth — same glass language as the Neural Nexus portals."
        : variant === "super"
          ? "Templates, organizations, and questions — global platform tools."
          : "Use your BolderBrain credentials.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        return;
      }

      const session = await readSessionAfterSignIn();
      if (!session?.user) {
        toast.error("Could not establish your session. Please try again.");
        return;
      }

      const raw = callbackUrlParam?.trim() ?? "";
      const useCallback =
        raw !== "" && raw !== "/" && raw !== "/login" && raw !== "/auth/login" && isSafeInternalPath(raw);

      let path: string;
      if (useCallback) {
        path = raw;
      } else if (variant === "organization") {
        path = "/admin";
      } else if (variant === "employees") {
        path = "/app/dashboard";
      } else if (variant === "super") {
        path = "/super-admin";
      } else {
        path = getDefaultPostLoginPath(session);
      }

      // Full navigation so the JWT cookie is always sent on the next request (fixes admin → employee mis-route).
      window.location.replace(path);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030305] p-4">
      <Card
        className={cn(
          "w-full max-w-sm rounded-[2rem] border border-white/[0.15] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl",
          variant === "employees" && "shadow-[0_0_48px_rgba(99,102,241,0.22)]",
          variant === "organization" && "shadow-[0_0_56px_rgba(245,158,11,0.24)]",
          variant === "super" && "shadow-[0_0_40px_rgba(168,85,247,0.2)]",
        )}
      >
        <CardHeader className="px-8 pt-10">
          <CardTitle
            className={cn(
              "font-heading text-2xl",
              variant === "organization" &&
                "text-transparent bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text",
              variant === "employees" &&
                "text-transparent bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text",
              variant === "super" && "text-transparent bg-gradient-to-r from-purple-200 to-fuchsia-300 bg-clip-text",
              variant === "default" && "text-gradient-heading",
            )}
          >
            {title}
          </CardTitle>
          <CardDescription className="text-white/55">{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/10 bg-white/[0.05] text-white/90 ring-offset-[#030305] placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/10 bg-white/[0.05] text-white/90 ring-offset-[#030305] placeholder:text-white/30"
              />
            </div>
            {variant === "organization" ? (
              <Button
                type="submit"
                disabled={pending}
                variant="outline"
                className="w-full border-amber-400/40 bg-[#030305]/50 text-amber-50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-600 hover:text-white"
              >
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            ) : variant === "super" ? (
              <Button
                type="submit"
                disabled={pending}
                variant="outline"
                className="w-full border-purple-400/40 bg-[#030305]/50 text-purple-100 hover:border-purple-300/55 hover:bg-white/[0.06]"
              >
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            ) : (
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
