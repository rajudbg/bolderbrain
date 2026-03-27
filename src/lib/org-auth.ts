import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function requireOrgMember(slug: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/org/${slug}`)}`);
  }
  const tenant = session.user.tenants.find((t) => t.slug === slug);
  if (!tenant) {
    redirect("/");
  }
  return { session, tenant };
}

export async function requireOrgAdmin(slug: string) {
  const { session, tenant } = await requireOrgMember(slug);
  if (tenant.role !== "ADMIN" && tenant.role !== "SUPER_ADMIN") {
    redirect(`/org/${slug}`);
  }
  return { session, tenant };
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
}
