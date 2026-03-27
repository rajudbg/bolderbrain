import { notFound } from "next/navigation";
import { getOrganizationBySlug, requireOrgAdmin } from "@/lib/org-auth";
import {
  listOrgActionsForManualAssign,
  listOrgMembersForDevelopment,
  listOrgUserActionsForAdmin,
} from "./actions";
import { OrgDevelopmentClient } from "./_components/org-development-client";

export default async function OrgDevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireOrgAdmin(slug);
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const [members, actions, recentAssignments] = await Promise.all([
    listOrgMembersForDevelopment(slug),
    listOrgActionsForManualAssign(slug),
    listOrgUserActionsForAdmin(slug),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Development actions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manually assign catalog actions or dismiss open items for people in {org.name}.
        </p>
      </div>
      <OrgDevelopmentClient
        slug={slug}
        members={members}
        actions={actions}
        recentAssignments={recentAssignments}
      />
    </div>
  );
}
