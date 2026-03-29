import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { testAiConnectionAdmin } from "@/app/actions/ai-connection";
import { AiConnectionTestCard } from "@/components/profile/ai-connection-test";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/profile");
  }

  const orgId = await requireAdminOrganizationId();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, slug: true, settings: true },
  });

  const settings =
    org?.settings && typeof org.settings === "object" ? (org.settings as Record<string, unknown>) : {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-3xl">
          Profile &amp; workspace
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Your admin account and the organization you have selected in the sidebar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h2 className="font-heading text-lg font-semibold text-white/90">Account</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-white/45">Name</dt>
              <dd className="text-white/90">{session.user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/45">Email</dt>
              <dd className="text-white/90">{session.user.email ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h2 className="font-heading text-lg font-semibold text-white/90">Current organization</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-white/45">Name</dt>
              <dd className="text-white/90">{org?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/45">Slug</dt>
              <dd className="font-mono text-white/80">{org?.slug ?? "—"}</dd>
            </div>
            {typeof settings.industry === "string" && (
              <div>
                <dt className="text-white/45">Industry (metadata)</dt>
                <dd className="text-white/80">{settings.industry}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <AiConnectionTestCard variant="admin" testAction={testAiConnectionAdmin} />

      <p className="text-sm text-white/45">
        Employee-facing profile:{" "}
        <Link href="/app/profile" className="text-indigo-400 underline-offset-2 hover:underline">
          /app/profile
        </Link>
      </p>
    </div>
  );
}
