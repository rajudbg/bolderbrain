"use server";

import { revalidatePath } from "next/cache";
import { seedDemoOrganization, wipeDemoOrganization } from "@/lib/demo-seed";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";

export async function resetDemoDataAction() {
  await requirePlatformSuperAdmin();
  await wipeDemoOrganization();
  await seedDemoOrganization();
  revalidatePath("/super-admin");
  revalidatePath("/admin");
  revalidatePath("/app");
  return { ok: true as const };
}
