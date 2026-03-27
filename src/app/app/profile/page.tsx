import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/app/profile");

  const claims = session.user.tenants ?? [];
  const orgIds = claims.map((c) => c.organizationId);
  const orgs =
    orgIds.length > 0
      ? await prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your account and organization memberships.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>From your sign-in provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{session.user.name ?? "—"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{session.user.email ?? "—"}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            You can access employee tools for each workspace you belong to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {claims.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organization memberships yet.</p>
          ) : (
            claims.map((c) => {
              const o = orgs.find((x) => x.id === c.organizationId);
              return (
                <div
                  key={c.organizationId}
                  className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{o?.name ?? c.slug}</p>
                    <p className="text-muted-foreground text-xs">{o?.slug ?? c.slug}</p>
                  </div>
                  <Badge variant="secondary">{c.role.replace(/_/g, " ")}</Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
