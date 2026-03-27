"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { ADMIN_ORG_COOKIE, listAdminTenants } from "@/lib/admin/context";
import { revalidatePath } from "next/cache";

export async function setAdminOrgSlugCookie(slug: string) {
  const session = await auth();
  const adminOrgs = listAdminTenants(session?.user?.tenants);
  if (!adminOrgs.some((t) => t.slug === slug)) {
    throw new Error("Invalid organization");
  }
  const store = await cookies();
  store.set(ADMIN_ORG_COOKIE, slug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  revalidatePath("/admin");
}
