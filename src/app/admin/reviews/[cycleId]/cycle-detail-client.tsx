'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Users, Star, TrendingUp, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewCycleDetail } from '@/lib/reviews';
import { shareReviewResults } from '../actions';
import { ReviewStatus } from '@/generated/prisma/enums';

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  SELF_REVIEW: 'Self-review submitted',
  MANAGER_REVIEW: 'Manager reviewed',
  CALIBRATION: 'Calibrated',
  SHARED: 'Shared',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'border-white/15 bg-white/5 text-white/40',
  SELF_REVIEW: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  MANAGER_REVIEW: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  CALIBRATION: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  SHARED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  CLOSED: 'border-white/10 bg-white/[0.02] text-white/30',
};

export function CycleDetailClient({ cycle }: { cycle: ReviewCycleDetail }) {
  const [pending, startTransition] = useTransition();
  const total = cycle.reviews.length;
  const byStatus = Object.fromEntries(
    Object.keys(STATUS_LABELS).map(s => [s, cycle.reviews.filter(r => r.status === s).length])
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/reviews">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white/80">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-caption-cerebral">Review cycle</p>
          <h1 className="text-2xl font-semibold text-white/90">{cycle.name}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-white/90">{byStatus[status] ?? 0}</p>
            <p className="text-xs text-white/45 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Rating distribution */}
      {cycle.reviews.some(r => r.managerRating != null) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white/80 mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-indigo-400" /> Rating distribution
          </h2>
          <div className="flex items-end gap-2 h-24">
            {[1,2,3,4,5].map(star => {
              const count = cycle.reviews.filter(r =>
                r.managerRating != null &&
                Math.round(r.managerRating) === star
              ).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 min-h-[4px] transition-all"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-xs text-white/50">{star}★</span>
                  <span className="text-xs font-medium text-white/70">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share results action */}
      {cycle.reviews.some(r => r.status === ReviewStatus.CALIBRATION) && (
        <div className="flex justify-end">
          <Button
            onClick={() => startTransition(async () => {
              try {
                await shareReviewResults(cycle.id);
                toast.success('Results shared with employees');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed');
              }
            })}
            disabled={pending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90"
          >
            <Share2 className="size-4" />
            {pending ? 'Sharing…' : 'Share results with employees'}
          </Button>
        </div>
      )}

      {/* Reviews table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Manager</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Self rating</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Manager rating</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Final</th>
            </tr>
          </thead>
          <tbody>
            {cycle.reviews.map(r => {
              const sc = STATUS_COLORS[r.status] ?? '';
              return (
                <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white/85">
                    {r.employee.name ?? r.employee.email}
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {r.manager?.name ?? r.manager?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {r.selfRating != null ? `${r.selfRating} ★` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {r.managerRating != null ? `${r.managerRating} ★` : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-white/80">
                    {r.finalRating != null ? `${r.finalRating} ★` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
