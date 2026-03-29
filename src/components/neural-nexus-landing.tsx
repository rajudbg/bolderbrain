"use client";

/**
 * Neural Nexus landing — three portals (Employees, Organization, Super Admin).
 * Future: optional UI sounds — attach to portal `onPointerDown` / successful `router.push` (Web Audio API or HTMLAudioElement).
 */

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Building2, Shield, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const EMPLOYEES_HREF = "/auth/login?portal=employees&callbackUrl=%2Fapp%2Fdashboard";
const ORG_HREF = "/auth/login?portal=organization&callbackUrl=%2Fadmin";
/** When not yet a platform super admin, go to login first — avoids client Link → /super-admin + middleware redirect (can hang on “Opening…”). */
const SUPER_ADMIN_LOGIN_HREF = "/auth/login?portal=super&callbackUrl=%2Fsuper-admin";

type PortalKey = "employees" | "organization" | "super";

function NexusParticles({ reduced }: { reduced: boolean }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${(i * 19 + (i % 5) * 11) % 100}%`,
        delay: `${(i % 14) * 0.35}s`,
        duration: `${12 + (i % 9)}s`,
        size: i % 5 === 0 ? 2 : 1,
      })),
    [],
  );
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="nexus-particle absolute rounded-full bg-white/25"
          style={{
            left: d.left,
            bottom: "-6px",
            width: d.size,
            height: d.size,
            animationDuration: d.duration,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

function NeuralConnections() {
  return (
    <svg
      className="pointer-events-none absolute top-[36%] left-0 z-0 hidden h-[min(260px,32vh)] w-full opacity-[0.14] lg:block"
      viewBox="0 0 1200 220"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="nexus-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.45)" />
          <stop offset="50%" stopColor="rgba(245,158,11,0.35)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.4)" />
        </linearGradient>
      </defs>
      <path
        d="M 100 110 Q 350 50 600 110 T 1100 110"
        fill="none"
        stroke="url(#nexus-line)"
        strokeWidth="1.2"
      />
      <path
        d="M 100 140 L 600 90 L 1100 140"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
        strokeDasharray="5 10"
      />
    </svg>
  );
}

export function NeuralNexusLanding() {
  const { data: session, status } = useSession();
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  /** Match SSR + first client paint: session and prefers-reduced-motion differ after hydration if applied immediately. */
  const reduceMotion = mounted && Boolean(prefersReducedMotion);
  const [hover, setHover] = useState<PortalKey | null>(null);
  const [navigating, setNavigating] = useState<PortalKey | null>(null);
  /** Stable href — do not branch on session here (SSR vs client session = hydration mismatch). */
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [cursorOnPortals, setCursorOnPortals] = useState(false);

  const track = useCallback((e: React.PointerEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!cursorOnPortals || reduceMotion) return;
    const onMove = (e: PointerEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [cursorOnPortals, reduceMotion]);

  function siblingDim(key: PortalKey) {
    return hover !== null && hover !== key;
  }

  return (
    <div
      className={cn(
        "relative z-20 min-h-screen overflow-x-hidden bg-[#030305] text-white",
        cursorOnPortals && !reduceMotion && "max-md:cursor-default md:cursor-none",
      )}
      onPointerMove={track}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-[22%] top-[8%] h-[min(72vw,580px)] w-[min(72vw,580px)] rounded-full bg-indigo-600/22 blur-[120px]" />
        <div className="absolute top-[16%] left-[22%] h-[min(88vw,660px)] w-[min(88vw,660px)] rounded-full bg-amber-500/16 blur-[135px]" />
        <div className="absolute -right-[18%] top-[22%] h-[min(68vw,540px)] w-[min(68vw,540px)] rounded-full bg-fuchsia-600/18 blur-[115px]" />
        <div
          className="absolute inset-0 transition-[background] duration-700 ease-out"
          style={{
            background:
              hover === "employees"
                ? "radial-gradient(ellipse 55% 48% at 18% 42%, rgba(99,102,241,0.14), transparent 52%)"
                : hover === "organization"
                  ? "radial-gradient(ellipse 50% 45% at 50% 36%, rgba(245,158,11,0.16), transparent 52%)"
                  : hover === "super"
                    ? "radial-gradient(ellipse 45% 42% at 82% 40%, rgba(168,85,247,0.12), transparent 48%)"
                    : undefined,
          }}
        />
      </div>

      <NexusParticles reduced={Boolean(reduceMotion)} />
      <NeuralConnections />

      {!reduceMotion && cursorOnPortals && (
        <div
          className="pointer-events-none fixed z-[100] hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-500/30 blur-md md:block"
          style={{ left: cursor.x, top: cursor.y }}
          aria-hidden
        />
      )}

      {mounted && status === "authenticated" && session?.user && (
        <div className="relative z-30 border-b border-white/[0.06] bg-[#030305]/85 px-4 py-3 text-center text-sm text-white/70 backdrop-blur-md">
          Signed in as <span className="text-white/90">{session.user.email ?? "user"}</span>
          <span className="mx-2 text-white/30">·</span>
          <Link href="/app/dashboard" className="text-indigo-300 underline-offset-2 hover:underline">
            Dashboard
          </Link>
          {" · "}
          <Link href="/assessments" className="text-indigo-300 underline-offset-2 hover:underline">
            Assessments
          </Link>
        </div>
      )}

      <div className="relative z-20 mx-auto flex max-w-[1400px] flex-col items-center px-4 pt-10 pb-16 md:px-8 md:pt-14 md:pb-24">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="font-heading text-7xl font-bold tracking-tighter text-transparent sm:text-8xl md:text-[10rem] bg-gradient-to-b from-white via-white to-white/75 bg-clip-text">
            BolderBrain
          </h1>
          <p className="mt-4 text-2xl font-light text-white/90 sm:text-3xl md:text-5xl">Where Behavior Meets Intelligence</p>
          <p className="mt-6 text-sm tracking-[0.2em] text-white/40 uppercase">
            360° Feedback · Cognitive Testing · Behavioral Analytics
          </p>
        </motion.header>

        <div
          className="relative z-10 mt-14 w-full md:mt-20"
          onPointerEnter={() => setCursorOnPortals(true)}
          onPointerLeave={() => {
            setCursorOnPortals(false);
            setHover(null);
          }}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 py-4 lg:grid-cols-3 lg:gap-8 lg:py-8">
            {/* Employees */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "order-2 transition-all duration-300 lg:order-1",
                !reduceMotion && "nexus-float-a",
                siblingDim("employees") && "scale-[0.97] opacity-60 blur-[1px]",
              )}
              onHoverStart={() => setHover("employees")}
              onHoverEnd={() => setHover(null)}
            >
              <Link
                href={EMPLOYEES_HREF}
                onClick={() => setNavigating("employees")}
                className={cn(
                  "group relative flex h-full min-h-[320px] flex-col rounded-[2rem] border border-white/[0.15] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] backdrop-blur-3xl md:min-h-[380px] md:p-10",
                  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                  "hover:z-10 hover:scale-105 hover:border-white/30 hover:shadow-[0_0_72px_rgba(99,102,241,0.42)]",
                  navigating === "employees" && "pointer-events-none opacity-75",
                )}
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg md:size-16">
                  <Users className="size-7 text-white md:size-8" strokeWidth={1.75} />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-white/95 md:text-3xl">Employees</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65 md:text-base">
                  Complete assessments, view your behavioral profile, and track personal growth
                </p>
                <span
                  className={cn(
                    buttonVariants(),
                    "mt-8 inline-flex w-full items-center justify-center sm:w-auto",
                    navigating === "employees" && "opacity-80",
                  )}
                >
                  {navigating === "employees" ? "Opening…" : "Employee Login"}
                </span>
              </Link>
            </motion.div>

            {/* Organization — primary */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "order-1 transition-all duration-300 lg:order-2 lg:pt-0",
                !reduceMotion && "nexus-float-b",
                siblingDim("organization") && "scale-[0.97] opacity-60 blur-[1px]",
              )}
              onHoverStart={() => setHover("organization")}
              onHoverEnd={() => setHover(null)}
            >
              <Link
                href={ORG_HREF}
                onClick={() => setNavigating("organization")}
                className={cn(
                  "group relative flex h-full min-h-[340px] flex-col rounded-[2rem] border border-amber-400/30 bg-gradient-to-b from-white/[0.1] to-white/[0.03] p-6 pt-7 shadow-[0_0_60px_rgba(245,158,11,0.3)] backdrop-blur-3xl md:min-h-[420px] md:scale-110 md:p-10 md:pt-11",
                  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-200/25 before:to-transparent",
                  "hover:z-20 hover:scale-[1.06] hover:border-amber-300/45 hover:shadow-[0_0_88px_rgba(245,158,11,0.42)] md:hover:scale-[1.14]",
                  navigating === "organization" && "pointer-events-none opacity-75",
                )}
              >
                <div className="nexus-shimmer-overlay pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative z-10 mb-5 self-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[10px] font-semibold tracking-widest text-[#030305] uppercase shadow-[0_0_28px_rgba(245,158,11,0.4)] md:mb-6 md:-mt-1">
                  For HR & Leaders
                </span>
                <div className="relative z-10 mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg md:size-16">
                  <Building2 className="size-7 text-white md:size-8" strokeWidth={1.75} />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-white/95 md:text-3xl">Organization</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/70 md:text-base">
                  Manage 360 reviews, analyze team competencies, assign development actions
                </p>
                <span
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-8 inline-flex w-full items-center justify-center border-amber-400/45 bg-[#030305]/50 text-amber-50 backdrop-blur-sm sm:w-auto",
                    "hover:border-amber-300/55 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-600 hover:text-white hover:shadow-[0_0_32px_rgba(245,158,11,0.38)]",
                    navigating === "organization" && "opacity-80",
                  )}
                >
                  {navigating === "organization" ? "Opening…" : "Admin Login"}
                </span>
              </Link>
            </motion.div>

            {/* Super Admin */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "order-3 transition-all duration-300 lg:order-3 lg:scale-[0.82]",
                siblingDim("super") && "scale-[0.92] opacity-60 blur-[1px] lg:scale-[0.78]",
              )}
              onHoverStart={() => setHover("super")}
              onHoverEnd={() => setHover(null)}
            >
              {/* Native <a> so navigation is a full document load — Next <Link> to /super-admin + middleware redirect could leave the UI stuck on “Opening…”. */}
              <a
                href={SUPER_ADMIN_LOGIN_HREF}
                onClick={() => setNavigating("super")}
                className={cn(
                  "group relative flex h-full min-h-[300px] flex-col rounded-[2rem] border border-purple-500/15 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 shadow-[0_0_22px_rgba(168,85,247,0.14)] backdrop-blur-3xl md:min-h-[360px] md:p-10",
                  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                  "hover:z-10 hover:border-purple-400/30 hover:shadow-[0_0_44px_rgba(168,85,247,0.22)]",
                  navigating === "super" && "pointer-events-none opacity-75",
                )}
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-purple-200/95 md:size-14">
                  <Shield className="size-6 md:size-7" strokeWidth={1.5} />
                </div>
                <h2 className="font-heading text-xl font-semibold text-white/85 md:text-2xl">Super Admin</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/50">
                  Platform management and global configuration
                </p>
                <span
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "mt-8 inline-flex w-full items-center justify-center border border-white/15 text-white/65 sm:w-auto",
                    "hover:border-white/28 hover:bg-white/[0.05] hover:text-white/90",
                  )}
                >
                  {navigating === "super" ? "Opening…" : "System Access"}
                </span>
              </a>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.45 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-xs text-white/45 backdrop-blur-xl md:mt-16"
        >
          <span>SOC 2 Compliant</span>
          <span className="text-white/25">•</span>
          <span>GDPR Ready</span>
          <span className="text-white/25">•</span>
          <span>Enterprise Security</span>
        </motion.div>
      </div>

      {navigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-0 z-[85] bg-[#030305]"
          aria-hidden
        />
      )}
    </div>
  );
}
