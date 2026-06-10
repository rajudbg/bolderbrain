"use server";

import prisma from "@/lib/prisma";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { revalidatePath } from "next/cache";

export async function updateOrganizationSettings(formData: FormData) {
  const orgId = await requireAdminOrganizationId();
  
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  if (!name || !slug) throw new Error("Name and slug are required");

  await prisma.organization.update({
    where: { id: orgId },
    data: { name, slug },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/app/dashboard");
  return { success: true };
}
