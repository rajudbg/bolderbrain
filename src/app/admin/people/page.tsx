import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPeopleDirectory } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";
import { BulkRosterImport } from "./bulk-roster-import";
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
          Import roster rows, update departments for heatmaps, adjust org roles, and deactivate accounts.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Roster import</CardTitle>
          <CardDescription>Paste CSV rows: email,name,department,role. Roles: EMPLOYEE, ADMIN, or SUPER_ADMIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <BulkRosterImport />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Search, update departments, adjust org roles, and activate/deactivate access.</CardDescription>
        </CardHeader>
        <CardContent>
          <PeopleTable rows={people} />
        </CardContent>
      </Card>
    </div>
  );
}
