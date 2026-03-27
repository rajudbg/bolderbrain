import Link from "next/link";
import { requireOrgMember } from "@/lib/org-auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireOrgMember(slug);
  const isAdmin = tenant.role === "ADMIN" || tenant.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white/90">
      <header className="border-b border-white/[0.08] bg-[#1A1A1E]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="text-sm font-medium text-white/70 hover:text-white">
            Home
          </Link>
          <Link href="/app/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Dashboard
          </Link>
          <Link href="/assessments" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            My assessments
          </Link>
          {isAdmin && (
            <>
              <Link
                href={`/org/${slug}/assessments`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Manage 360
              </Link>
              <Link
                href={`/org/${slug}/development`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Development
              </Link>
            </>
          )}
          <Link href={`/org/${slug}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Org home
          </Link>
          <span className="text-muted-foreground ml-auto text-xs">{slug}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
