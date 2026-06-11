'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Plus, Calendar, Users, CheckCircle2, Clock,
  ChevronRight, Zap, Archive, Play, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReviewCycleSummary } from '@/lib/reviews';
import { createReviewCycle, activateReviewCycle, updateCycleStatus } from './actions';
import { ReviewCycleStatus } from '@/generated/prisma/enums';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'text-white/50 border-white/20 bg-white/5' },
  ACTIVE: { label: 'Active', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  ARCHIVED: { label: 'Archived', color: 'text-white/30 border-white/10 bg-white/[0.02]' },
};

export function ReviewCyclesClient({ cycles }: { cycles: ReviewCycleSummary[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '',
    reviewPeriodStart: '',
    reviewPeriodEnd: '',
    selfOpenAt: '',
    selfCloseAt: '',
    managerOpenAt: '',
    managerCloseAt: '',
    maxRating: '5',
  });

  function handleCreate() {
    startTransition(async () => {
      try {
        await createReviewCycle({
          name: form.name,
          reviewPeriodStart: new Date(form.reviewPeriodStart),
          reviewPeriodEnd: new Date(form.reviewPeriodEnd),
          selfOpenAt: new Date(form.selfOpenAt),
          selfCloseAt: new Date(form.selfCloseAt),
          managerOpenAt: new Date(form.managerOpenAt),
          managerCloseAt: new Date(form.managerCloseAt),
          maxRating: parseInt(form.maxRating, 10),
          goals: [],
        });
        toast.success('Review cycle created');
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create cycle');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90">
                <Plus className="size-4" /> New Cycle
              </Button>
            }
          />
          <DialogContent className="max-w-lg border-white/10 bg-[#0F0F17] text-white">
            <DialogHeader>
              <DialogTitle className="text-white/90">Create review cycle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Cycle name</Label>
                <Input
                  className="border-white/10 bg-white/[0.04] text-white/90"
                  placeholder="H1 2026 Appraisal"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Review period start</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.reviewPeriodStart} onChange={e => setForm(f => ({ ...f, reviewPeriodStart: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Review period end</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.reviewPeriodEnd} onChange={e => setForm(f => ({ ...f, reviewPeriodEnd: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Self-review opens</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.selfOpenAt} onChange={e => setForm(f => ({ ...f, selfOpenAt: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Self-review closes</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.selfCloseAt} onChange={e => setForm(f => ({ ...f, selfCloseAt: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Manager review opens</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.managerOpenAt} onChange={e => setForm(f => ({ ...f, managerOpenAt: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs">Manager review closes</Label>
                  <Input type="date" className="border-white/10 bg-white/[0.04] text-white/80" value={form.managerCloseAt} onChange={e => setForm(f => ({ ...f, managerCloseAt: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Rating scale (max stars)</Label>
                <div className="flex gap-2">
                  {['3','4','5','10'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, maxRating: v }))}
                      className={`flex-1 rounded-lg border py-1.5 text-sm transition-all ${
                        form.maxRating === v
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20'
                      }`}
                    >
                      1–{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/60">Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={pending || !form.name}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
              >
                {pending ? 'Creating…' : 'Create cycle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {cycles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <ClipboardList className="size-8 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white/80">No review cycles yet</p>
            <p className="text-sm text-white/40 mt-1">Create your first appraisal cycle to start managing performance reviews.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90">
            <Plus className="size-4" /> Create first cycle
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cycles.map(cycle => {
            const cfg = STATUS_CONFIG[cycle.status];
            return (
              <div
                key={cycle.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white/90 truncate">{cycle.name}</h3>
                    <p className="text-xs text-white/45 mt-1">
                      {new Date(cycle.reviewPeriodStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} —{' '}
                      {new Date(cycle.reviewPeriodEnd).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Link href={`/admin/reviews/${cycle.id}`}>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/80 group-hover:opacity-100">
                      <ChevronRight className="size-4" />
                    </Button>
                  </Link>
                </div>

                {cycle.totalReviews > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span>{cycle.completedReviews}/{cycle.totalReviews} completed</span>
                      <span>{cycle.completionPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                        style={{ width: `${cycle.completionPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {cycle.status === 'DRAFT' && (
                  <div className="mt-4">
                    <ActivateCycleButton cycleId={cycle.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivateCycleButton({ cycleId }: { cycleId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      disabled={pending}
      onClick={() => startTransition(async () => {
        try {
          await activateReviewCycle(cycleId);
          toast.success('Cycle activated — review records created for all employees');
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Failed');
        }
      })}
    >
      <Play className="size-3.5" />
      {pending ? 'Activating…' : 'Activate cycle'}
    </Button>
  );
}
