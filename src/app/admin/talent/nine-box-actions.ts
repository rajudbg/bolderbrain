'use server';

import { requireAdminOrganizationId } from '@/lib/admin/context';
import { auth } from '@/auth';
import { upsertGridPlacement, autoSuggestPlacements } from '@/lib/nine-box';

export async function placeEmployee(
  employeeId: string,
  performanceScore: number,
  potentialScore: number,
  notes: string,
) {
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');
  await upsertGridPlacement(orgId, session.user.id, employeeId, performanceScore, potentialScore, notes);
}

export async function triggerAutoSuggest() {
  const orgId = await requireAdminOrganizationId();
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');
  const count = await autoSuggestPlacements(orgId, session.user.id);
  return { count };
}
