"use server";

import { auth } from "@/auth";
import { hasOpenRouterCredentials } from "@/lib/ai/openrouter";
import { runOpenRouterPing, type OpenRouterPingResult } from "@/lib/ai/run-openrouter-ping";

/** Employee app: any signed-in user can verify server AI config. */
export async function testAiConnectionEmployee(): Promise<OpenRouterPingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, hasKey: false, message: "You must be signed in." };
  }
  return runOpenRouterPing();
}

/** Org admin: same ping; ensures only authenticated admins reach this (call from admin profile only). */
export async function testAiConnectionAdmin(): Promise<OpenRouterPingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, hasKey: false, message: "You must be signed in." };
  }
  const tenants = session.user.tenants ?? [];
  const isAdmin = tenants.some((t) => t.role === "ADMIN" || t.role === "SUPER_ADMIN");
  if (!isAdmin) {
    return { ok: false, hasKey: hasOpenRouterCredentials(), message: "Organization admin access required." };
  }
  return runOpenRouterPing();
}
