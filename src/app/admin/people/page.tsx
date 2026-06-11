import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPeopleDirectory } from '@/lib/admin/queries';
import { requireAdminOrganizationId } from '@/lib/admin/context';
import { getOrgMembers } from '@/app/admin/hr-actions';
import { BulkRosterImport } from './bulk-roster-import';
import { PeopleTable } from './people-table';

export default async function PeoplePage() {
  const orgId = await requireAdminOrganizationId();
  const [people, allMembers] = await Promise.all([
    getPeopleDirectory(orgId),
    getOrgMembers(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-caption-cerebral">Directory</p>
        <h1 className="text-gradient-heading text-4xl">People &amp; access</h1>
        <p className="text-body-cerebral mt-1 max-w-2xl">
          Import roster rows, set managers, update departments, adjust org roles, and deactivate accounts.
        </p>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Roster import</CardTitle>
          <CardDescription>
            Upload or paste CSV: email, name, department, role, manager_email. Roles: EMPLOYEE, ADMIN, SUPER_ADMIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkRosterImport />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Search, set managers, update departments, adjust roles, and activate/deactivate access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeopleTable rows={people} allMembers={allMembers} />
        </CardContent>
      </Card>
    </div>
  );
}
