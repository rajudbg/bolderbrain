'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { Database, Plus, RefreshCw, X, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createHrmsIntegration, disableHrmsIntegration, regenerateHrmsSecret } from './hrms-actions';

export function HrmsIntegrationClient({ integrations }: { integrations: any[] }) {
  const [pending, startTransition] = useTransition();
  const [provider, setProvider] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  function handleAdd() {
    if (!provider) return;
    startTransition(async () => {
      try {
        await createHrmsIntegration(provider as any);
        toast.success(`${provider} integration added`);
        setProvider('');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to add integration');
      }
    });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs text-muted-foreground">Select HRMS Provider</label>
          <Select value={provider} onValueChange={(val) => setProvider(val || '')}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Choose provider..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Darwinbox">Darwinbox</SelectItem>
              <SelectItem value="Keka">Keka</SelectItem>
              <SelectItem value="GreytHR">GreytHR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={pending || !provider}>
          <Plus className="mr-2 size-4" /> Add Integration
        </Button>
      </div>

      <div className="space-y-4">
        {integrations.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Database className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No active HRMS integrations</p>
            <p className="text-xs text-muted-foreground mt-1">Connect your HR system to sync the employee directory automatically.</p>
          </div>
        ) : (
          integrations.map(integration => {
            const webhookUrl = `${baseUrl}/api/hrms-webhook/${integration.provider.toLowerCase()}`;
            return (
              <div key={integration.id} className="rounded-xl border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="size-5 text-indigo-500" />
                    <h3 className="font-semibold">{integration.provider}</h3>
                    {integration.isActive ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startTransition(async () => {
                        await regenerateHrmsSecret(integration.id);
                        toast.success('Webhook secret regenerated');
                      })}
                    >
                      <RefreshCw className="mr-2 size-3" /> Rotate Secret
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => startTransition(async () => {
                        await disableHrmsIntegration(integration.id);
                        toast.success('Integration disabled');
                      })}
                    >
                      <X className="mr-2 size-3" /> Disable
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs truncate">
                        {webhookUrl}
                      </code>
                      <Button variant="outline" size="icon" className="size-7" onClick={() => handleCopy(webhookUrl)}>
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Bearer Token (Secret)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs truncate">
                        {integration.webhookSecret}
                      </code>
                      <Button variant="outline" size="icon" className="size-7" onClick={() => handleCopy(integration.webhookSecret)}>
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  {integration.lastSyncAt ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                    </>
                  ) : (
                    <>Waiting for first webhook event...</>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
