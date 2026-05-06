"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Building2,
  Users,
  Mail,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: CheckCircle2,
    text: "Personalized platform walkthrough",
  },
  {
    icon: CheckCircle2,
    text: "Custom pricing for your team size",
  },
  {
    icon: CheckCircle2,
    text: "Implementation timeline review",
  },
  {
    icon: CheckCircle2,
    text: "Q&A with our product specialists",
  },
];

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    size: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">30-minute demo</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
              See BolderBrain in action
            </h1>

            <p className="text-lg text-white/60 mb-8">
              Schedule a personalized demo with our team. We&apos;ll show you how 
              leading organizations use BolderBrain to transform their people strategy.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <benefit.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-white/80">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/[0.03]">
              <p className="text-sm text-white/50 mb-2">Prefer to explore on your own?</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Start a free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {submitted ? (
              <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Demo request received!
                </h3>
                <p className="text-white/60">
                  Our team will reach out within 24 hours to schedule your personalized demo.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-8 rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <h2 className="text-xl font-semibold text-white mb-6">
                  Request your demo
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10",
                        "text-white placeholder-white/30",
                        "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                        "transition-all"
                      )}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10",
                        "text-white placeholder-white/30",
                        "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                        "transition-all"
                      )}
                      placeholder="jane@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className={cn(
                          "w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10",
                          "text-white placeholder-white/30",
                          "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                          "transition-all"
                        )}
                        placeholder="Acme Inc"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Team Size
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <select
                        required
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className={cn(
                          "w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10",
                          "text-white",
                          "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                          "transition-all appearance-none"
                        )}
                      >
                        <option value="" className="bg-[#1a1a1e]">Select team size</option>
                        <option value="1-50" className="bg-[#1a1a1e]">1-50 employees</option>
                        <option value="51-200" className="bg-[#1a1a1e]">51-200 employees</option>
                        <option value="201-1000" className="bg-[#1a1a1e]">201-1,000 employees</option>
                        <option value="1000+" className="bg-[#1a1a1e]">1,000+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      What would you like to see?
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10",
                        "text-white placeholder-white/30",
                        "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                        "transition-all resize-none"
                      )}
                      placeholder="Tell us about your specific needs or questions..."
                    />
                  </div>

                  <button
                    type="submit"
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
                      "bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold",
                      "hover:from-indigo-400 hover:to-purple-500 transition-all",
                      "shadow-lg shadow-indigo-500/25"
                    )}
                  >
                    <Calendar className="h-5 w-5" />
                    Schedule Demo
                  </button>

                  <p className="text-xs text-white/40 text-center">
                    By submitting, you agree to our{" "}
                    <Link href="#" className="text-indigo-400 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
