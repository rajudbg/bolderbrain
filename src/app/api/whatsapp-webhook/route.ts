import { NextResponse } from 'next/server';
import { getUserWhatsAppProfile } from '@/lib/whatsapp';
import prisma from '@/lib/prisma';

// Meta verification token
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bb_whatsapp_verify_token';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp message event
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              const from = message.from; // Sender's phone number
              const text = message.text?.body?.toLowerCase();

              // Handle STOP/START keywords for opt-in/out
              if (text === 'stop' || text === 'start') {
                const profile = await prisma.userWhatsAppProfile.findFirst({
                  where: { phoneNumber: { endsWith: from.slice(-10) } },
                });
                
                if (profile) {
                  await prisma.userWhatsAppProfile.update({
                    where: { userId: profile.userId },
                    data: { optedIn: text === 'start' },
                  });
                }
              }
            }
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
