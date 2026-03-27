import { listOrganizationsForDevelopment } from "./actions";
import { DevelopmentClient } from "./_components/development-client";

export default async function SuperAdminDevelopmentPage() {
  const organizations = await listOrganizationsForDevelopment();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Development library</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Define competencies (match 360 question competency keys) and catalog actions. Auto-assignment picks from
          these after each completed 360.
        </p>
      </div>
      <DevelopmentClient organizations={organizations} initialOrgId={organizations[0]?.id ?? null} />
    </div>
  );
}
