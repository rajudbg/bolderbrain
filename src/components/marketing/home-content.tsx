"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  Zap,
  Shield,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Quote,
  Search,
  GraduationCap,
  LineChart,
  FileQuestion,
  Bot,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Core value proposition - what HR leaders see first */
const valueProps = [
  { icon: Search, label: "Identify skill gaps" },
  { icon: GraduationCap, label: "Launch targeted training" },
  { icon: LineChart, label: "Measure actual impact" },
];

/** End-to-end TNA/TNI workflow */
const tnaWorkflow = [
  {
    step: "1",
    title: "Identify Gaps",
    description: "Automatically surface competency gaps from 360° feedback, assessments, and manager evaluations.",
    icon: Search,
  },
  {
    step: "2",
    title: "Generate Training",
    description: "AI recommends specific training programs mapped to each identified gap.",
    icon: Bot,
  },
  {
    step: "3",
    title: "Assign & Track",
    description: "Deploy training to individuals or cohorts with automated progress tracking.",
    icon: Workflow,
  },
  {
    step: "4",
    title: "Measure Impact",
    description: "Post-training assessments show real skill improvement and ROI.",
    icon: LineChart,
  },
];

/** AI capabilities */
const aiFeatures = [
  {
    icon: FileQuestion,
    title: "AI Question Generation",
    description: "Generate role-specific assessment questions in seconds. Just enter a competency and AI creates validated questions.",
  },
  {
    icon: Brain,
    title: "Smart Insights",
    description: "AI analyzes assessment data and writes personalized development recommendations for every employee.",
  },
  {
    icon: Zap,
    title: "Auto Actions",
    description: "Automatically create weekly development tasks based on assessment results and track completion streaks.",
  },
];

const features = [
  {
    icon: Target,
    title: "360° Feedback",
    description: "Multi-source assessments combining self, peer, and manager perspectives with AI-generated insights.",
  },
  {
    icon: Brain,
    title: "Cognitive Testing",
    description: "IQ and logical reasoning assessments with adaptive difficulty and detailed competency mapping.",
  },
  {
    icon: Sparkles,
    title: "EQ Assessment",
    description: "Emotional intelligence evaluation across Goleman's five domains with personalized development paths.",
  },
  {
    icon: Users,
    title: "Psychometric Profiles",
    description: "Big Five/OCEAN personality insights for team dynamics and role-fit analysis.",
  },
  {
    icon: BarChart3,
    title: "Skills Inventory",
    description: "Real-time competency heatmaps identifying gaps and tracking development progress.",
  },
  {
    icon: Zap,
    title: "AI-Powered Actions",
    description: "Smart development recommendations automatically generated from assessment results.",
  },
];

const testimonials = [
  {
    quote: "BolderBrain transformed how we approach talent development. The AI insights save our HR team hours every week.",
    author: "Sarah Chen",
    role: "VP People, TechCorp",
  },
  {
    quote: "Finally, a platform that connects assessments to actual development. Our completion rates increased 40%.",
    author: "Marcus Johnson",
    role: "Head of L&D, GlobalFin",
  },
  {
    quote: "The psychometric profiling helped us build more balanced teams. Game changer for our hiring process.",
    author: "Elena Rodriguez",
    role: "Chief People Officer, ScaleUp Inc",
  },
];

const stats = [
  { value: "500+", label: "Organizations" },
  { value: "2M+", label: "Assessments Delivered" },
  { value: "94%", label: "Completion Rate" },
  { value: "4.9/5", label: "User Satisfaction" },
];

export function HomeContent() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Hero Section - Value Proposition First */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Main Value Proposition - Clear & Concise */}
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Close skill gaps.
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent block mt-2">
                Prove training works.
              </span>
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              The only platform that connects assessment insights to training impact. 
              From identifying needs to measuring ROI — end to end.
            </p>

            {/* Value Prop Pillars - What HR Leaders Get */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10">
              {valueProps.map((prop, i) => (
                <motion.div
                  key={prop.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <prop.icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-white/80 font-medium">{prop.label}</span>
                  {i < valueProps.length - 1 && (
                    <ArrowRight className="hidden sm:block h-4 w-4 text-white/30 ml-2" />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/marketing/demo"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold",
                  "bg-gradient-to-r from-indigo-500 to-purple-600 text-white",
                  "hover:from-indigo-400 hover:to-purple-500 transition-all",
                  "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                )}
              >
                Book a Demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/marketing/features"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold",
                  "bg-white/5 text-white border border-white/10",
                  "hover:bg-white/10 transition-all"
                )}
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for people intelligence
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Comprehensive assessment tools paired with AI-powered insights to drive real development outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "group p-6 rounded-2xl border border-white/10 bg-white/[0.03]",
                  "hover:bg-white/[0.05] hover:border-white/20 transition-all"
                )}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TNA/TNI Workflow Section */}
      <section className="relative py-24 lg:py-32 border-t border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">End-to-End Training Management</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              From gap identification to impact measurement
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Complete Training Needs Analysis (TNA) and Training Needs Identification (TNI) 
              workflow — all in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tnaWorkflow.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative p-6 rounded-2xl border border-white/10 bg-white/[0.03]",
                  "hover:bg-white/[0.05] transition-all"
                )}
              >
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {step.step}
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 mt-2">
                  <step.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-medium">AI automates the entire workflow</span>
              </div>
              <p className="text-sm text-white/60 text-center md:text-right">
                Gap detection → Training recommendation → Assignment → Impact analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="relative py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Generate assessments. Get insights. Automatically.
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Stop writing questions manually. Our AI creates validated assessments 
              and delivers personalized insights at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {aiFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-2xl border border-white/10 bg-white/[0.03]",
                  "hover:bg-white/[0.05] transition-all"
                )}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by HR leaders worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-2xl border border-white/10 bg-white/[0.03]",
                  "hover:bg-white/[0.05] transition-all"
                )}
              >
                <Quote className="h-8 w-8 text-indigo-400/50 mb-4" />
                <p className="text-white/80 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-white">{t.author}</div>
                  <div className="text-sm text-white/50">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={cn(
              "relative p-8 md:p-12 rounded-3xl text-center overflow-hidden",
              "border border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
            )}
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to transform your people strategy?
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
                Join 500+ organizations using BolderBrain to understand, develop, and retain their best talent.
              </p>
              <Link
                href="/marketing/demo"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold",
                  "bg-white text-indigo-900",
                  "hover:bg-white/90 transition-all"
                )}
              >
                Schedule Your Demo
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
