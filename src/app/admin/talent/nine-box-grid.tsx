'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, Plus, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { TalentGridPlacementWithUser } from '@/lib/nine-box';
import { placeEmployee, triggerAutoSuggest } from './nine-box-actions';

const CELL_LABELS: Record<string, string> = {
  '3-3': 'Star',
  '2-3': 'Future Star',
  '1-3': 'High Potential',
  '3-2': 'Strong Performer',
  '2-2': 'Core Player',
  '1-2': 'Developing',
  '3-1': 'Effective',
  '2-1': 'Inconsistent',
  '1-1': 'Underperformer',
};

function getCellLabel(perf: number, potential: number): string {
  const key = `${Math.round(perf)}-${Math.round(potential)}`;
  return CELL_LABELS[key] ?? 'Unknown';
}

type Employee = { userId: string; name: string | null; email: string | null };

interface NineBoxGridProps {
  placements: TalentGridPlacementWithUser[];
  employees: Employee[];
}

// Grid layout: rows = potential (High->Low), cols = performance (Low->High)
const GRID_CELLS = [
  { perf: 1, pot: 3, label: 'High Potential', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  { perf: 2, pot: 3, label: 'Future Star',   gradient: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
  { perf: 3, pot: 3, label: 'Star',           gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { perf: 1, pot: 2, label: 'Developing',     gradient: 'from-white/[0.02] to-white/[0.04]', border: 'border-white/10', badge: 'text-white/50 bg-white/5 border-white/15' },
  { perf: 2, pot: 2, label: 'Core Player',    gradient: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { perf: 3, pot: 2, label: 'Strong Performer', gradient: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', badge: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { perf: 1, pot: 1, label: 'Underperformer', gradient: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/20', badge: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { perf: 2, pot: 1, label: 'Inconsistent',   gradient: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-500/20', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { perf: 3, pot: 1, label: 'Effective',      gradient: 'from-white/[0.03] to-white/[0.05]', border: 'border-white/15', badge: 'text-white/60 bg-white/5 border-white/20' },
];

export function NineBoxGrid({ placements, employees }: NineBoxGridProps) {
  const [pending, startTransition] = useTransition();
  const [placeOpen, setPlaceOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', perf: '2', pot: '2', notes: '' });

  // Group placements by cell
  const byCell = new Map<string, TalentGridPlacementWithUser[]>();
  for (const p of placements) {
    const key = `${Math.round(p.performanceScore)}-${Math.round(p.potentialScore)}`;
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key)!.push(p);
  }

  // Employees not yet placed
  const placedIds = new Set(placements.map(p => p.employeeId));
  const unplaced = employees.filter(e => !placedIds.has(e.userId));

  function handlePlace() {
    startTransition(async () => {
      try {
        await placeEmployee(form.employeeId, Number(form.perf), Number(form.pot), form.notes);
        toast.success(`Employee placed in ${getCellLabel(Number(form.perf), Number(form.pot))}`);
        setPlaceOpen(false);
        setForm({ employeeId: '', perf: '2', pot: '2', notes: '' });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  function handleAutoSuggest() {
    startTransition(async () => {
      try {
        const { count } = await triggerAutoSuggest();
        toast.success(`Auto-suggested placements for ${count} employee(s) from assessment data`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/50">{placements.length} employees placed · {unplaced.length} unplaced</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            disabled={pending}
            onClick={handleAutoSuggest}
          >
            <Sparkles className="size-3.5" />
            {pending ? 'Processing…' : 'Auto-suggest from data'}
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
            onClick={() => setPlaceOpen(true)}
          >
            <Plus className="size-3.5" /> Place employee
          </Button>
        </div>
      </div>

      {/* Axis labels */}
      <div className="relative">
        {/* Potential axis label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-white/40 tracking-widest uppercase">
          Potential ↑
        </div>
        {/* Grid */}
        <div className="grid grid-cols-3 gap-2 ml-4">
          {/* Column headers */}
          <div className="col-span-3 grid grid-cols-3 gap-2 mb-1">
            {['Low Performance', 'Medium Performance', 'High Performance'].map(h => (
              <div key={h} className="text-center text-[10px] font-medium uppercase tracking-wider text-white/35">{h}</div>
            ))}
          </div>
          {GRID_CELLS.map(cell => {
            const key = `${cell.perf}-${cell.pot}`;
            const cellPlacements = byCell.get(key) ?? [];
            return (
              <div
                key={key}
                className={`rounded-2xl border bg-gradient-to-br ${cell.gradient} ${cell.border} p-3 min-h-[140px] flex flex-col gap-2 transition-all hover:border-opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cell.badge}`}>
                    {cell.label}
                  </span>
                  <span className="text-[10px] text-white/30">{cellPlacements.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cellPlacements.slice(0, 6).map(p => (
                    <div
                      key={p.id}
                      title={`${p.employee.name ?? p.employee.email}${p.isAutoSuggested ? ' (auto)' : ''}`}
                      className="flex size-7 items-center justify-center rounded-full bg-white/10 border border-white/20 text-[9px] font-medium text-white/70 hover:bg-white/20 cursor-default transition-all"
                    >
                      {(p.employee.name ?? p.employee.email ?? '?')[0]?.toUpperCase()}
                    </div>
                  ))}
                  {cellPlacements.length > 6 && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[9px] text-white/40">
                      +{cellPlacements.length - 6}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Performance axis label */}
        <div className="text-center text-[10px] font-medium text-white/40 tracking-widest uppercase mt-2 ml-4">
          Performance →
        </div>
      </div>

      {/* Place employee dialog */}
      <Dialog open={placeOpen} onOpenChange={setPlaceOpen}>
        <DialogContent className="border-white/10 bg-[#0F0F17] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white/90">Place employee in 9-box</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-white/70 text-xs">Employee</Label>
              <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v || '' }))}>
                <SelectTrigger className="border-white/10 bg-white/[0.04] text-white/80">
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.userId} value={e.userId}>
                      {e.name ?? e.email}
                      {placedIds.has(e.userId) ? ' (placed)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Performance</Label>
                <Select value={form.perf} onValueChange={v => setForm(f => ({ ...f, perf: v || '' }))}>
                  <SelectTrigger className="border-white/10 bg-white/[0.04] text-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Potential</Label>
                <Select value={form.pot} onValueChange={v => setForm(f => ({ ...f, pot: v || '' }))}>
                  <SelectTrigger className="border-white/10 bg-white/[0.04] text-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-white/50">Cell preview</p>
              <p className="text-base font-semibold text-white/85 mt-1">
                {getCellLabel(Number(form.perf), Number(form.pot))}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-white/70 text-xs">Notes (optional)</Label>
              <Textarea
                className="border-white/10 bg-white/[0.03] text-white/80 placeholder:text-white/25"
                placeholder="Context for this placement…"
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPlaceOpen(false)} className="text-white/60">Cancel</Button>
            <Button
              onClick={handlePlace}
              disabled={pending || !form.employeeId}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
            >
              {pending ? 'Placing…' : 'Place in grid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
