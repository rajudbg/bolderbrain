'use server';

import { auth } from '@/auth';
import { upsertUserWhatsAppProfile } from '@/lib/whatsapp';
import { revalidatePath } from 'next/cache';

export async function saveWhatsAppSettings(phoneNumber: string, isOptedIn: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Basic phone validation (strip non-digits, ensure length)
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  if (cleaned && cleaned.replace('+', '').length < 10) {
    throw new Error('Invalid phone number format');
  }

  await upsertUserWhatsAppProfile(session.user.id, cleaned, isOptedIn);
  revalidatePath('/app/profile');
}
