"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Building2, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    icon: Users,
    price: "$5",
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
    cta: "Start Free Trial",
    href: "/demo",
    popular: false,
  },
  {
    name: "Professional",
    icon: Sparkles,
    price: "$12",
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
    cta: "Start Free Trial",
    href: "/demo",
    popular: true,
  },
  {
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
    href: "/demo",
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
    a: "Yes, all plans include a 14-day free trial with full access to features. No credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, ACH transfers, and can arrange annual invoicing for Enterprise customers.",
  },
  {
    q: "Can I export my data?",
    a: "Absolutely. Your data belongs to you. Export reports, raw responses, and analytics anytime in CSV or JSON format.",
  },
];

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
                <Link
                  href={plan.href}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all",
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
