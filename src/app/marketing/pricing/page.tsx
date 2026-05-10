"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import { Check, Sparkles, Building2, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RAZORPAY_TEST_KEY_ID = "rzp_test_tXcOz47WMwAJRt";
type RazorpayPlanKey = "starter" | "professional";

type RazorpayOrderResponse = {
  ok: boolean;
  error?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  theme: { color: string };
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    icon: Users,
    price: "₹499",
    period: "per employee / month",
    description: "Perfect for small teams getting started with people analytics.",
    features: [
      "Up to 100 employees",
      "360° feedback assessments",
      "EQ and basic psychometric tests",
      "Individual development tracking",
      "Email support",
      "Standard analytics dashboard",
    ],
    cta: "Pay with Razorpay",
    href: "/marketing/demo",
    paymentPlanKey: "starter" as RazorpayPlanKey,
    popular: false,
  },
  {
    key: "professional" as const,
    name: "Professional",
    icon: Sparkles,
    price: "₹999",
    period: "per employee / month",
    description: "Advanced insights and AI features for growing organizations.",
    features: [
      "Up to 1,000 employees",
      "Everything in Starter, plus:",
      "AI-powered assessment insights",
      "Cognitive/IQ testing",
      "Full psychometric profiling (Big Five)",
      "Skills inventory & gap analysis",
      "Training needs analysis (TNA)",
      "Priority support",
      "API access",
    ],
    cta: "Pay with Razorpay",
    href: "/marketing/demo",
    paymentPlanKey: "professional" as RazorpayPlanKey,
    popular: true,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "tailored pricing",
    description: "Full-featured platform for large organizations with custom needs.",
    features: [
      "Unlimited employees",
      "Everything in Professional, plus:",
      "Custom assessment development",
      "White-label branding",
      "SSO & advanced security",
      "HRIS integration support",
      "Dedicated success manager",
      "SLA guarantees",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    href: "/marketing/demo",
    paymentPlanKey: null,
    popular: false,
  },
];

const faqs = [
  {
    q: "How does the per-employee pricing work?",
    a: "You only pay for active employees who take assessments in a given month. Inactive users don't count toward your bill.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, you can upgrade or downgrade at any time. Prorated charges or credits will be applied automatically.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, we can activate a pilot workspace after the demo so your team can validate the workflow before a full rollout.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Online payments are powered by Razorpay in test mode. Enterprise customers can still use annual invoicing.",
  },
  {
    q: "Can I export my data?",
    a: "Absolutely. Your data belongs to you. Export reports, raw responses, and analytics anytime in CSV or JSON format.",
  },
];

function RazorpayCheckoutButton({
  planKey,
  label,
  popular,
}: {
  planKey: RazorpayPlanKey;
  label: string;
  popular: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  async function startCheckout() {
    if (!scriptReady || !window.Razorpay) {
      toast.error("Payment checkout is still loading. Please try again in a moment.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/payments/razorpay/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const order = (await res.json().catch(() => null)) as RazorpayOrderResponse | null;
      if (!res.ok || !order?.ok || !order.orderId || !order.amount || !order.currency) {
        throw new Error(order?.error || "Could not start Razorpay checkout.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId || RAZORPAY_TEST_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: order.name || "BolderBrain",
        description: order.description || "BolderBrain subscription",
        order_id: order.orderId,
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => setPending(false),
        },
        handler: async (response) => {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, planKey }),
          });
          const verified = (await verifyRes.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
          setPending(false);
          if (!verifyRes.ok || !verified?.ok) {
            toast.error(verified?.error || "Payment could not be verified.");
            return;
          }
          toast.success("Payment verified. We will activate your workspace next.");
        },
      });

      checkout.open();
    } catch (err) {
      setPending(false);
      toast.error(err instanceof Error ? err.message : "Could not start Razorpay checkout.");
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all",
          popular
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500"
            : "bg-white/10 text-white hover:bg-white/20",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {pending ? "Opening checkout..." : label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

export default function PricingPage() {
  return (
    <div className="relative pt-32 pb-24">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-white/60">
            Pay only for what you use. Scale up or down as your team grows.
          </p>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-2xl",
                plan.popular
                  ? "border-2 border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent"
                  : "border border-white/10 bg-white/[0.03]"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-semibold">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    plan.popular
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                      : "bg-white/10"
                  )}>
                    <plan.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50 ml-2">{plan.period}</span>
                </div>

                <p className="text-white/60 mb-6">{plan.description}</p>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={cn(
                        "h-5 w-5 shrink-0",
                        plan.popular ? "text-indigo-400" : "text-white/40"
                      )} />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 pt-0">
                {plan.paymentPlanKey ? (
                  <RazorpayCheckoutButton
                    planKey={plan.paymentPlanKey}
                    label={plan.cta}
                    popular={plan.popular}
                  />
                ) : (
                  <Link
                    href={plan.href}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all",
                      plan.popular
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-white text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-white/60 text-sm">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
