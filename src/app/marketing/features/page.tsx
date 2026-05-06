"use client";

import { motion } from "framer-motion";
import {
  Target,
  Brain,
  Sparkles,
  Users,
  BarChart3,
  Zap,
  Shield,
  Lock,
  Gauge,
  Puzzle,
  FileCheck,
  Clock,
  Globe,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const assessmentFeatures = [
  {
    icon: Target,
    title: "360° Feedback",
    description: "Comprehensive multi-rater assessments capturing self, peer, and manager perspectives.",
    capabilities: [
      "Configurable evaluator roles and weights",
      "Anonymous or attributed feedback options",
      "Automated reminder workflows",
      "Real-time completion tracking",
    ],
  },
  {
    icon: Brain,
    title: "Cognitive Assessment",
    description: "IQ and logical reasoning tests with adaptive difficulty and detailed scoring.",
    capabilities: [
      "Numerical, verbal, and spatial reasoning",
      "Timed assessments with auto-submit",
      "Percentile ranking against norm groups",
      "Confidence intervals and category labels",
    ],
  },
  {
    icon: Sparkles,
    title: "EQ Evaluation",
    description: "Emotional intelligence across Goleman's five domains with development guidance.",
    capabilities: [
      "Scenario-based and self-report items",
      "Domain-level scoring (Self-Awareness, Empathy, etc.)",
      "Quadrant positioning visualization",
      "Personalized growth recommendations",
    ],
  },
  {
    icon: Users,
    title: "Psychometric Profiling",
    description: "Big Five/OCEAN personality insights for individual and team analysis.",
    capabilities: [
      "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism",
      "Validity flags and consistency checks",
      "Role matching and career insights",
      "Team dynamics recommendations",
    ],
  },
];

const platformFeatures = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into organizational competency landscapes and development trends.",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    description: "Smart analysis of assessment data with personalized development recommendations.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant infrastructure with data encryption and privacy controls.",
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    description: "Complete data separation between organizations with role-based access.",
  },
  {
    icon: Gauge,
    title: "Skills Inventory",
    description: "Real-time competency heatmaps tracking individual and organizational gaps.",
  },
  {
    icon: Puzzle,
    title: "Training Integration",
    description: "Connect assessments to training programs with pre/post impact measurement.",
  },
  {
    icon: FileCheck,
    title: "TNA Diagnostics",
    description: "Training needs analysis identifying skill gaps against organizational targets.",
  },
  {
    icon: Clock,
    title: "Development Tracking",
    description: "Weekly action assignments with streak tracking and progress analytics.",
  },
  {
    icon: Globe,
    title: "Multi-language Ready",
    description: "Support for global teams with localization capabilities.",
  },
  {
    icon: Workflow,
    title: "HRIS Integration",
    description: "Connect with your existing HR stack via API and webhooks.",
  },
];

export default function FeaturesPage() {
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
            Comprehensive people intelligence
          </h1>
          <p className="text-xl text-white/60">
            Everything you need to assess, understand, and develop your workforce — 
            from cognitive testing to AI-powered insights.
          </p>
        </motion.div>
      </div>

      {/* Assessment Types */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-8">
          Assessment Capabilities
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {assessmentFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-8 rounded-2xl border border-white/10 bg-white/[0.03]",
                "hover:bg-white/[0.05] transition-all"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </div>
              </div>
              <ul className="ml-16 space-y-2">
                {feature.capabilities.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-sm text-white/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    {cap}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Platform Features Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-8">
          Platform Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "p-6 rounded-xl border border-white/5 bg-white/[0.02]",
                "hover:bg-white/[0.04] hover:border-white/10 transition-all"
              )}
            >
              <feature.icon className="h-5 w-5 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
