"use server";

import { requireAdminOrganizationId } from "@/lib/admin/context";
import { getFeedback360Console, getPeopleDirectory } from "@/lib/admin/queries";

function csvEscape(s: string | null | undefined): string {
  const v = (s ?? "").replace(/"/g, '""');
  return `"${v}"`;
}

export async function buildPeopleCsv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const rows = await getPeopleDirectory(orgId);
  const header = ["name", "email", "department", "role", "active"].join(",");
  const lines = rows.map(
    (r) =>
      [csvEscape(r.name), csvEscape(r.email), csvEscape(r.department), r.role, r.isActive ? "yes" : "no"].join(","),
  );
  return [header, ...lines].join("\n");
}

export async function build360Csv(): Promise<string> {
  const orgId = await requireAdminOrganizationId();
  const rows = await getFeedback360Console(orgId);
  const header = [
    "assessment_id",
    "subject_name",
    "subject_email",
    "template",
    "status",
    "progress_pct",
    "self_complete",
    "peers_complete",
    "manager_complete",
    "due_at",
    "updated_at",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      csvEscape(r.subjectName),
      csvEscape(r.subjectEmail),
      csvEscape(r.templateName),
      r.status,
      r.progressPct,
      r.selfComplete ? "yes" : "no",
      r.peersComplete ? "yes" : "no",
      r.managerComplete ? "yes" : "no",
      csvEscape(r.dueAt),
      csvEscape(r.updatedAt),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}
