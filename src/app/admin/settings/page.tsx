import { requireAdminOrganizationId } from "@/lib/admin/context";
import prisma from "@/lib/prisma";
import { SettingsForm } from "./settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HrmsIntegrationClient } from "./hrms-integration-client";

export default async function SettingsPage() {
  const orgId = await requireAdminOrganizationId();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  
  if (!org) return null;

  const integrations = await prisma.hrmsIntegration.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Organization Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage your organization profile, preferences, and billing.
        </p>
      </header>

      <div className="grid gap-8">
        <SettingsForm orgName={org.name} orgSlug={org.slug} />
        
        <Card>
          <CardHeader>
            <CardTitle>HRMS Integrations</CardTitle>
            <CardDescription>Sync employee directory automatically via webhook.</CardDescription>
          </CardHeader>
          <CardContent>
            <HrmsIntegrationClient integrations={integrations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan & Billing</CardTitle>
            <CardDescription>Your current subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Enterprise Plan</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Includes unlimited 360 assessments and AI coach.</p>
              </div>
              <Badge variant="outline" className="h-8">Billed annually</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
