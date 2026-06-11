import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList, ChevronRight } from 'lucide-react';
import { requireAdminOrganizationId } from '@/lib/admin/context';
import { getReviewCycles } from '@/lib/reviews';
import { ReviewCyclesClient } from './reviews-client';

export default async function ReviewsPage() {
  const orgId = await requireAdminOrganizationId();
  const cycles = await getReviewCycles(orgId);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-caption-cerebral">Performance</p>
          <h1 className="text-gradient-heading text-4xl">Review Cycles</h1>
          <p className="text-body-cerebral mt-1 max-w-2xl">
            Manage annual and half-yearly appraisal cycles. Create a cycle, activate it to generate
            review records, and track completion across all employees.
          </p>
        </div>
      </header>

      <ReviewCyclesClient cycles={cycles} />
    </div>
  );
}
