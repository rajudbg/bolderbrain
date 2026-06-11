'use client';

import Link from 'next/link';
import { ClipboardList, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewStatus } from '@/generated/prisma/enums';

const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Self-review needed', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  SELF_REVIEW: { label: 'Under manager review', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  MANAGER_REVIEW: { label: 'Calibration', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  CALIBRATION: { label: 'Calibration', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  SHARED: { label: 'Results shared', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  CLOSED: { label: 'Closed', color: 'text-white/30 border-white/10 bg-white/[0.02]' },
};

export function MyReviewsClient({ reviews }: { reviews: any[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
          <ClipboardList className="size-8 text-indigo-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white/80">No reviews yet</p>
          <p className="text-sm text-white/40 mt-1">You will be notified when a performance review cycle starts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reviews.map(review => {
        const cfg = STATUS_CONFIG[review.status as keyof typeof STATUS_CONFIG];
        return (
          <div
            key={review.id}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <h3 className="font-semibold text-white/90 truncate">{review.cycle.name}</h3>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {review.status === ReviewStatus.NOT_STARTED && (
                <Link href={`/app/reviews/${review.cycleId}/self`}>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90">
                    Start self-review <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              )}
              {review.status === ReviewStatus.SHARED && (
                <Link href={`/app/reviews/${review.cycleId}/self`}>
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                    View results <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
