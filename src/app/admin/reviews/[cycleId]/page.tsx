import { notFound } from 'next/navigation';
import { requireAdminOrganizationId } from '@/lib/admin/context';
import { getReviewCycleDetail } from '@/lib/reviews';
import { CycleDetailClient } from './cycle-detail-client';

export default async function CycleDetailPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const orgId = await requireAdminOrganizationId();
  const cycle = await getReviewCycleDetail(orgId, cycleId);
  if (!cycle) notFound();
  return <CycleDetailClient cycle={cycle} />;
}
