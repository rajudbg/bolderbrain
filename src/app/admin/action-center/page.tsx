import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActionOversight } from "@/lib/admin/queries";
import { requireAdminOrganizationId } from "@/lib/admin/context";

export default async function ActionCenterPage() {
  const orgId = await requireAdminOrganizationId();
  const data = await getActionOversight(orgId);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Development</p>
        <h1 className="text-3xl font-semibold tracking-tight">Action oversight</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Company-wide completion rates and long-running assignments. Template authoring remains in Super Admin /
          competency catalog.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Overall completion (all time)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{data.completionRatePct}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Status mix</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-1">
              {data.byStatus.map((s) => (
                <li key={s.status}>
                  <strong>{s.status}</strong>: {s.count}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action bottlenecks</CardTitle>
          <CardDescription>Assigned or in-progress for more than 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2">Person</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {data.bottlenecks.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2">
                      <div>{b.userName ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">{b.userEmail}</div>
                    </td>
                    <td className="py-2">{b.actionTitle}</td>
                    <td className="py-2">{b.status}</td>
                    <td className="py-2 tabular-nums">{new Date(b.assignedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.bottlenecks.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No bottlenecks detected.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
