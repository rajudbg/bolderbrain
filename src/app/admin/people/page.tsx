import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPeopleDirectory } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { PeopleTable } from "./people-table";

export default async function PeoplePage() {
  const orgId = await requireAdminOrganizationId();
  const people = await getPeopleDirectory(orgId);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Directory</p>
        <h1 className="text-3xl font-semibold tracking-tight">People &amp; access</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Update departments for heatmaps, adjust org roles, and deactivate accounts. Bulk CSV invite is a stub — wire to
          your IdP or HRIS.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bulk invite (stub)</CardTitle>
          <CardDescription>Paste CSV rows: email,department — processing not wired in this build.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-xs"
            rows={4}
            placeholder={"email,department\ncarol@example.com,Engineering"}
            readOnly
          />
          <p className="text-muted-foreground mt-2 text-xs">
            Connect provisioning or use Super Admin user creation flows for production.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Sortable table — refine with URL filters in a follow-up</CardDescription>
        </CardHeader>
        <CardContent>
          <PeopleTable rows={people} />
        </CardContent>
      </Card>
    </div>
  );
}
