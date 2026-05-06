import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetDemoButton } from "./reset-demo-button";
import { SuperAdminSkeleton } from "@/components/ui/skeleton-loading";

export default async function SuperAdminHomePage() {
  return (
    <Suspense fallback={<SuperAdminSkeleton />}>
      <SuperAdminContent />
    </Suspense>
  );
}

async function SuperAdminContent() {
  await requirePlatformSuperAdmin();
  const [orgCount, templateCount, questionCount] = await Promise.all([
    prisma.organization.count(),
    prisma.assessmentTemplate.count(),
    prisma.question.count(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Super Admin</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-body-cerebral max-w-2xl">
          Platform-wide content and tenant configuration.
        </p>
      </header>

      <Card className="border-border/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Pilot demo dataset</CardTitle>
          <CardDescription>
            Recreates the Acme Corp tenant (slug acme-demo), demo users,
            completed 360s, IQ/EQ sessions, and sample actions. Same as npm run seed:demo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetDemoButton />
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Organizations</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{orgCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Total tenants on platform</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Assessment templates</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{templateCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Available across all orgs</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Questions</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{questionCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Question bank size</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}