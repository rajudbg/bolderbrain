export type RazorpayPlanKey = "starter" | "professional";

export const RAZORPAY_TEST_KEY_ID = "rzp_test_tXcOz47WMwAJRt";

export const razorpayPlans: Record<
  RazorpayPlanKey,
  {
    name: string;
    description: string;
    amount: number;
  }
> = {
  starter: {
    name: "Starter",
    description: "BolderBrain Starter monthly plan",
    amount: Number(process.env.RAZORPAY_STARTER_AMOUNT ?? "49900"),
  },
  professional: {
    name: "Professional",
    description: "BolderBrain Professional monthly plan",
    amount: Number(process.env.RAZORPAY_PROFESSIONAL_AMOUNT ?? "99900"),
  },
};

export function getRazorpayCurrency() {
  return (process.env.RAZORPAY_CURRENCY || "INR").trim().toUpperCase();
}

export function getRazorpayKeyId() {
  return (
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    RAZORPAY_TEST_KEY_ID
  );
}

export function getRazorpayKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || "";
}

export function formatRazorpayAmount(amount: number, currency = getRazorpayCurrency()) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
