import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayKeyId, getRazorpayKeySecret } from "@/lib/payments/razorpay";
import prisma from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import { notifyWelcomeNewOrg } from "@/lib/email";

export const runtime = "nodejs";

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  planKey: z.enum(["starter", "professional"]),
});

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payment response." }, { status: 400 });
  }

  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    return NextResponse.json({ ok: false, error: "Razorpay secret is not configured." }, { status: 503 });
  }

  const payload = `${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`;
  const expected = createHmac("sha256", keySecret).update(payload).digest("hex");

  if (!signaturesMatch(expected, parsed.data.razorpay_signature)) {
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 400 });
  }

  console.log("[razorpay payment verified]", {
    planKey: parsed.data.planKey,
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
  });

  try {
    const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${parsed.data.razorpay_payment_id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
    });
    const paymentData = await paymentRes.json();
    const email = paymentData?.email;

    if (email) {
      const emailPrefix = email.split("@")[0];
      const orgName = `${emailPrefix}'s Workspace`;
      const slug = `${emailPrefix}-${Math.random().toString(36).substring(7)}`;

      const org = await prisma.organization.create({
        data: { name: orgName, slug, settings: { plan: parsed.data.planKey } },
      });

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({ data: { email } });
      }

      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "ADMIN",
        },
      });

      const token = randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      await notifyWelcomeNewOrg(email, org.name, token);
      console.log(`[auto-provision] Provisioned org ${org.slug} for ${email}`);
    }
  } catch (err) {
    console.error("[auto-provision] Failed to provision org:", err);
  }

  return NextResponse.json({ ok: true });
}
