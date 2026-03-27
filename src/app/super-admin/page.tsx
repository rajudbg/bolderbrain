import prisma from "@/lib/prisma";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetDemoButton } from "./reset-demo-button";

export default async function SuperAdminHomePage() {
  await requirePlatformSuperAdmin();
  const [orgCount, templateCount, questionCount] = await Promise.all([
    prisma.organization.count(),
    prisma.assessmentTemplate.count(),
    prisma.question.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">Platform-wide content and tenant configuration.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilot demo dataset</CardTitle>
          <p className="text-muted-foreground text-sm font-normal">
            Recreates the Acme Corp tenant (slug <code className="text-foreground">acme-demo</code>), demo users,
            completed 360s, IQ/EQ sessions, and sample actions. Same as <code className="text-foreground">npm run seed:demo</code>.
          </p>
        </CardHeader>
        <CardContent>
          <ResetDemoButton />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{orgCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessment templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{templateCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{questionCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
