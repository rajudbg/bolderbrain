'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { saveWhatsAppSettings } from './whatsapp-actions';

interface WhatsAppProfileClientProps {
  initialPhone: string;
  initialOptIn: boolean;
}

export function WhatsAppProfileClient({ initialPhone, initialOptIn }: WhatsAppProfileClientProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await saveWhatsAppSettings(phone, optIn);
        toast.success('WhatsApp settings updated');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update');
      }
    });
  }

  const hasChanges = phone !== initialPhone || optIn !== initialOptIn;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border border-white/10 bg-white/[0.02] rounded-xl p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
          <MessageSquare className="size-5 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white/90">WhatsApp Notifications</p>
          <p className="text-xs text-white/50">Get alerts for reviews, 360 feedback, and HR tasks</p>
        </div>
        <Checkbox checked={optIn} onCheckedChange={(checked) => setOptIn(!!checked)} />
      </div>

      {optIn && (
        <div className="space-y-3 px-1">
          <div className="space-y-1.5">
            <Label className="text-white/70 text-xs">Phone Number (with country code)</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="border-white/10 bg-white/[0.04] text-white/90 max-w-xs"
            />
          </div>
          <p className="text-[10px] text-white/40 max-w-xs">
            By opting in, you agree to receive automated notifications from BolderBrain on WhatsApp. You can reply STOP at any time to opt out.
          </p>
        </div>
      )}

      {hasChanges && (
        <div className="pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={pending || (optIn && phone.replace(/[^0-9]/g, '').length < 10)}
            className="bg-green-600 text-white hover:bg-green-500"
          >
            <Save className="size-4 mr-2" />
            {pending ? 'Saving…' : 'Save WhatsApp Preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
