import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayKeySecret } from "@/lib/payments/razorpay";

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

  const keySecret = getRazorpayKeySecret();
  if (!keySecret) {
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

  return NextResponse.json({ ok: true });
}
