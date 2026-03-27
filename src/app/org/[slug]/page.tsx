import Link from "next/link";
import { requireOrgMember } from "@/lib/org-auth";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function OrgHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireOrgMember(slug);
  const isAdmin = tenant.role === "ADMIN" || tenant.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization workspace</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You are signed in as <span className="text-foreground">{tenant.role}</span>.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/assessments" className={buttonVariants()}>
          My assessments
        </Link>
        {isAdmin ? (
          <Link href={`/org/${slug}/assessments`} className={buttonVariants({ variant: "outline" })}>
            Manage 360 assessments
          </Link>
        ) : null}
      </div>
    </div>
  );
}
