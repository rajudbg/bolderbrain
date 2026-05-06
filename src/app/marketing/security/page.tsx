"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Server,
  FileCheck,
  Globe,
  Eye,
  Key,
  RefreshCw,
  CheckCircle2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const certifications = [
  {
    icon: Shield,
    title: "SOC 2 Type II",
    description: "Audited controls for security, availability, and confidentiality.",
    status: "In Progress",
  },
  {
    icon: FileCheck,
    title: "GDPR Compliant",
    description: "Full EU data protection regulation compliance with DPA available.",
    status: "Compliant",
  },
  {
    icon: Lock,
    title: "Data Encryption",
    description: "AES-256 encryption at rest, TLS 1.3 in transit.",
    status: "Active",
  },
  {
    icon: Server,
    title: "ISO 27001",
    description: "Information security management certification.",
    status: "In Progress",
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All data is encrypted in transit using TLS 1.3 and at rest with AES-256. Your assessment data is never exposed in plain text.",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    description:
      "Granular permissions ensure employees only see their own data, managers see their teams, and admins have org-wide visibility.",
  },
  {
    icon: Globe,
    title: "Tenant Isolation",
    description:
      "Complete data separation between organizations. Each tenant operates in a logically isolated environment.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description:
      "Comprehensive audit trails track all data access and modifications. Export logs for compliance reviews.",
  },
  {
    icon: Key,
    title: "SSO & MFA",
    description:
      "Enterprise authentication with SAML 2.0, OIDC support, and mandatory multi-factor authentication.",
  },
  {
    icon: RefreshCw,
    title: "Automated Backups",
    description:
      "Daily encrypted backups with point-in-time recovery. Data retention policies configurable per organization.",
  },
];

const complianceItems = [
  "Data Processing Agreements (DPA) available",
  "Right to erasure (GDPR Article 17) supported",
  "Data portability exports (CSV, JSON)",
  "Breach notification within 72 hours",
  "Regular penetration testing",
  "Annual security audits",
  "Employee background checks",
  "Secure development lifecycle (SDLC)",
];

export default function SecurityPage() {
  return (
    <div className="relative pt-32 pb-24">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Enterprise-Grade Security</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Your data is safe with us
          </h1>
          <p className="text-xl text-white/60">
            Security isn&apos;t an afterthought—it&apos;s built into everything we do.
            From encryption to compliance, we protect what matters most.
          </p>
        </motion.div>
      </div>

      {/* Certifications */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-xl border bg-white/[0.03]",
                cert.status === "Compliant"
                  ? "border-emerald-500/30"
                  : "border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <cert.icon
                  className={cn(
                    "h-6 w-6",
                    cert.status === "Compliant" ? "text-emerald-400" : "text-white/60"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    cert.status === "Compliant"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  )}
                >
                  {cert.status}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{cert.title}</h3>
              <p className="text-sm text-white/50">{cert.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-8">
          Security Architecture
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-xl border border-white/10 bg-white/[0.03]",
                "hover:bg-white/[0.05] transition-all"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Compliance & Privacy
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {complianceItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Contact CTA */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <p className="text-white/60 mb-4">
            Need a security questionnaire or have specific compliance requirements?
          </p>
          <a
            href="mailto:security@bolderbrain.com"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Contact our security team
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
