"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  Zap,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  Quote,
  Search,
  GraduationCap,
  LineChart,
  FileQuestion,
  Bot,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";


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
    author: "VP of People",
    role: "Leading Indian IT Services Company",
  },
  {
    quote: "Finally, a platform that connects assessments to actual development. Our completion rates increased 40% in the first quarter.",
    author: "Head of L&D",
    role: "Top 5 Indian Bank",
  },
  {
    quote: "The psychometric profiling helped us build more balanced teams. The integrated TNA workflow alone replaced three separate tools.",
    author: "Chief People Officer",
    role: "Indian Enterprise SaaS Unicorn",
  },
];

const stats = [
  { value: "100+", label: "Organizations" },
  { value: "4.2k", label: "Assessments Delivered" },
  { value: "94%", label: "Completion Rate" },
  { value: "4.9/5", label: "User Satisfaction" },
];

function HeroMockup() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.2, 0.65, 0.3, 0.9] }}
        style={{ perspective: "1000px" }}
      >
        <div className="glass-card relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/20">
          {/* Mockup Top Bar */}
          <div className="flex h-12 items-center gap-2 border-b border-white/[0.08] bg-white/[0.02] px-4">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-black/40 text-[10px] text-white/40">
              bolderbrain.com/app/insights
            </div>
          </div>
          {/* Mockup Content */}
          <div className="flex h-[400px] bg-black/40">
            {/* Sidebar */}
            <div className="hidden w-48 border-r border-white/[0.08] p-4 sm:block">
              <div className="mb-6 h-4 w-24 rounded bg-white/10" />
              <div className="space-y-3">
                <div className="h-3 w-full rounded bg-indigo-500/20" />
                <div className="h-3 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-5/6 rounded bg-white/5" />
              </div>
            </div>
            {/* Main Area */}
            <div className="flex-1 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="h-6 w-48 rounded bg-white/10" />
                <div className="h-8 w-24 rounded-lg bg-indigo-500/20" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-48 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                  {/* Fake Chart */}
                  <div className="flex h-full items-end gap-2">
                    {[40, 70, 45, 90, 60, 85, 30].map((h, i) => (
                      <div key={i} className="w-full rounded-t-sm bg-indigo-500/40" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-22 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="mb-2 h-3 w-16 rounded bg-emerald-500/20" />
                    <div className="h-8 w-12 rounded bg-white/10" />
                  </div>
                  <div className="h-22 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="mb-2 h-3 w-16 rounded bg-purple-500/20" />
                    <div className="h-8 w-12 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cards Foreground */}
        <motion.div
          initial={{ opacity: 0, y: 20, x: -20 }}
          animate={{ opacity: 1, y: [0, -10, 0], x: 0 }}
          transition={{ opacity: { delay: 0.8, duration: 0.5 }, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
          className="absolute -left-8 top-1/4 z-10 hidden sm:block"
        >
          <div className="glass-card flex items-center gap-3 rounded-xl border border-white/20 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Skill Gap Closed</div>
              <div className="text-xs text-emerald-400">+14% Leadership Score</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: [0, 10, 0], x: 0 }}
          transition={{ opacity: { delay: 1, duration: 0.5 }, y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 } }}
          className="absolute -right-8 top-1/2 z-10 hidden sm:block"
        >
          <div className="glass-card flex items-center gap-3 rounded-xl border border-white/20 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Assessment Ready</div>
              <div className="text-xs text-white/50">Auto-generated in 2.1s</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="aurora-bg absolute inset-0 opacity-50 mix-blend-screen" />
    </div>
  );
}

export function HomeContent() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <AnimatedGrid />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4" />
              <span>Meet the new standard for People Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
            >
              Close skill gaps.
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent block mt-2">
                Prove training works.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The only platform that connects assessment insights to training impact. 
              From identifying needs to measuring ROI — end to end.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/marketing/demo"
                className="btn-primary px-8 py-4 text-lg shadow-[0_0_24px_rgba(99,102,241,0.3)]"
              >
                Book a Demo
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/marketing/comparison"
                className="btn-secondary px-8 py-4 text-lg"
              >
                See Why We&apos;re Unmatched
              </Link>
            </motion.div>
          </div>

          <HeroMockup />
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
                className="card-premium group"
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
                className="card-premium group relative"
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
                className="card-premium group"
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
                className="card-premium group"
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
                Join 100+ organizations using BolderBrain to understand, develop, and retain their best talent.
              </p>
              <Link
                href="/marketing/demo"
                className="btn-primary px-8 py-4 text-lg"
              >
                Schedule Your Demo
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
