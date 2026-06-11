"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";

export function FloatingDemoWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-6 z-40 hidden md:block"
    >
      <Link
        href="/marketing/demo"
        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0A0A]/90 px-5 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <Calendar className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Book a demo</span>
          <span className="text-xs text-white/50">See it in action</span>
        </div>
        <ArrowRight className="h-4 w-4 text-indigo-400 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
