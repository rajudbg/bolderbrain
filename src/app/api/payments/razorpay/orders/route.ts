import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getRazorpayCurrency,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  razorpayPlans,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  planKey: z.enum(["starter", "professional"]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Select a valid plan." }, { status: 400 });
  }

  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keySecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Razorpay test key is configured. Add RAZORPAY_KEY_SECRET to create payment orders.",
      },
      { status: 503 },
    );
  }

  const plan = razorpayPlans[parsed.data.planKey];
  const currency = getRazorpayCurrency();
  const receipt = `${parsed.data.planKey}-${Date.now()}`.slice(0, 40);

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amount,
      currency,
      receipt,
      notes: {
        plan: parsed.data.planKey,
        app: "bolderbrain",
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { id?: string; amount?: number; currency?: string; error?: { description?: string } }
    | null;

  if (!res.ok || !data?.id) {
    return NextResponse.json(
      { ok: false, error: data?.error?.description || "Could not create Razorpay order." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    keyId,
    orderId: data.id,
    amount: data.amount ?? plan.amount,
    currency: data.currency ?? currency,
    name: "BolderBrain",
    description: plan.description,
  });
}
