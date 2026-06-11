import prisma from '@/lib/prisma';

/**
 * Utility to send WhatsApp messages using the Meta Cloud API.
 * This is a stub implementation that simulates sending if no token is configured.
 */

const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function sendWhatsAppMessage(toPhone: string, text: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.log(`[WhatsApp Stub] To: ${toPhone} | Message: ${text}`);
    return { success: true, stub: true };
  }

  const res = await fetch(`https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('[WhatsApp Error]', error);
    throw new Error(`WhatsApp API error: ${res.statusText}`);
  }

  return await res.json();
}

export async function getUserWhatsAppProfile(userId: string) {
  return prisma.userWhatsAppProfile.findUnique({
    where: { userId },
  });
}

export async function upsertUserWhatsAppProfile(userId: string, phoneNumber: string, isOptedIn: boolean) {
  return prisma.userWhatsAppProfile.upsert({
    where: { userId },
    create: { userId, phoneNumber, isOptedIn },
    update: { phoneNumber, isOptedIn },
  });
}

export async function notifyUserOnWhatsApp(userId: string, message: string) {
  const profile = await getUserWhatsAppProfile(userId);
  if (!profile || !profile.isOptedIn || !profile.phoneNumber) return false;
  try {
    await sendWhatsAppMessage(profile.phoneNumber, message);
    return true;
  } catch (e) {
    console.error('Failed to notify user on WhatsApp', e);
    return false;
  }
}
