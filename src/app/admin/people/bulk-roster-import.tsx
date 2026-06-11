'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, X, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importPeopleRoster } from '@/app/admin/hr-actions';
import { cn } from '@/lib/utils';

const SAMPLE_CSV = `email,name,department,role,manager_email
alice@company.com,Alice Sharma,Engineering,EMPLOYEE,bob@company.com
bob@company.com,Bob Mehta,Engineering,ADMIN,
carol@company.com,Carol Patel,Sales,EMPLOYEE,bob@company.com`;

type ParsedRow = {
  email: string;
  name: string;
  department: string;
  role: string;
  manager_email: string;
  _error?: string;
};

function parseCsvPreview(csv: string): ParsedRow[] {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const dataLines = lines[0]?.toLowerCase().startsWith('email') ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const [email = '', name = '', department = '', role = '', manager_email = ''] = line.split(',').map(c => c.trim());
    const hasError = !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return { email, name, department, role: role || 'EMPLOYEE', manager_email, _error: hasError ? 'Invalid email' : undefined };
  });
}

export function BulkRosterImport() {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleCsvChange(text: string) {
    setCsv(text);
    if (text.trim()) {
      setPreview(parseCsvPreview(text));
    } else {
      setPreview([]);
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => handleCsvChange(e.target?.result as string ?? '');
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const errorRows = preview.filter(r => r._error);
  const validRows = preview.filter(r => !r._error);

  function submit() {
    startTransition(async () => {
      try {
        const result = await importPeopleRoster(csv);
        toast.success('Roster imported', { description: result.message });
        setCsv('');
        setPreview([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Import failed');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200',
          dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/15 bg-white/[0.02] hover:border-white/25',
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <Upload className="size-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Drop a CSV file here, or</p>
            <button
              type="button"
              className="text-indigo-400 text-sm hover:underline"
              onClick={() => fileRef.current?.click()}
            >
              browse to upload
            </button>
          </div>
          <p className="text-xs text-white/35">Columns: email, name, department, role, manager_email</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Or paste */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">Or paste CSV directly:</p>
          {csv && (
            <button type="button" onClick={() => handleCsvChange('')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
              <X className="size-3" /> Clear
            </button>
          )}
        </div>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/25 focus:border-indigo-500/50 focus:outline-none"
          rows={4}
          placeholder={SAMPLE_CSV}
          value={csv}
          onChange={e => handleCsvChange(e.target.value)}
        />
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-white/50" />
              <p className="text-sm font-medium text-white/80">{preview.length} row(s) parsed</p>
            </div>
            <div className="flex items-center gap-3">
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="size-3" /> {errorRows.length} error(s)
                </span>
              )}
              {validRows.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3" /> {validRows.length} valid
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {['Email', 'Name', 'Department', 'Role', 'Manager'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-white/50">{h}</th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={cn('border-b border-white/[0.05]', row._error && 'bg-red-500/5')}>
                    <td className="px-3 py-1.5 text-white/80">{row.email}</td>
                    <td className="px-3 py-1.5 text-white/70">{row.name || '—'}</td>
                    <td className="px-3 py-1.5 text-white/60">{row.department || '—'}</td>
                    <td className="px-3 py-1.5 text-white/60">{row.role}</td>
                    <td className="px-3 py-1.5 text-white/60">{row.manager_email || '—'}</td>
                    <td className="px-3 py-1.5">
                      {row._error ? (
                        <span className="text-red-400">{row._error}</span>
                      ) : (
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={submit}
          disabled={pending || validRows.length === 0}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
        >
          <Users className="size-4" />
          {pending ? 'Importing…' : `Import ${validRows.length > 0 ? validRows.length : ''} row(s)`}
        </Button>
        <p className="text-xs text-white/35">
          New users are created inactive. Existing accounts are updated.
        </p>
      </div>
    </div>
  );
}
