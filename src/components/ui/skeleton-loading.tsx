"use client";

import { cn } from "@/lib/utils";

/** Generic shimmer bar — works for text, numbers, or image placeholders. */
export function ShimmerBlock({
  className,
  width = "100%",
  height = "1rem",
  borderRadius = "0.375rem",
  delay = 0,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("animate-pulse", className)}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: `shimmer-move 2s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

/** Card-level skeleton — drop-in for any Card component. */
export function CardSkeleton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
    >
      {children ?? <DefaultCardContent />}
    </div>
  );
}

/** Page-level skeleton — wraps an entire route's loading fallback. */
export function PageSkeleton({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl space-y-8 p-4", className)}>
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && <ShimmerBlock width="12rem" height="2rem" borderRadius="0.5rem" />}
          {subtitle && <ShimmerBlock width="20rem" height="1rem" delay={100} />}
        </div>
      )}
      {children ?? <DefaultPageContent />}
    </div>
  );
}

/** KPI card skeleton — matches the admin KPI card layout. */
export function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl">
      <ShimmerBlock width="6rem" height="0.875rem" delay={50} />
      <ShimmerBlock width="4rem" height="2.25rem" className="mt-3" delay={100} />
      <ShimmerBlock width="8rem" height="0.75rem" className="mt-3" delay={150} />
    </div>
  );
}

/** Chart placeholder skeleton — for any chart area. */
export function ChartSkeleton({ height = "280px" }: { height?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]"
      style={{ height }}
    >
      <div className="space-y-2 text-center">
        <div className="mx-auto h-3 w-24 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="mx-auto h-2 w-16 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

/** Table/list row skeleton. */
export function TableRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
        >
          <div className="flex flex-1 flex-col gap-2">
            <ShimmerBlock width="60%" height="1rem" delay={i * 50} />
            <ShimmerBlock width="40%" height="0.75rem" delay={i * 50 + 25} />
          </div>
          <ShimmerBlock width="5rem" height="2rem" borderRadius="0.5rem" delay={i * 50 + 75} />
        </div>
      ))}
    </div>
  );
}

/** Stat widget skeleton — for dashboard stat displays. */
export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-xl">
      <ShimmerBlock width="5rem" height="0.75rem" delay={50} />
      <ShimmerBlock width="3rem" height="1.75rem" className="mt-2" delay={100} />
    </div>
  );
}

/* ——— Default fallback content blocks ——— */

function DefaultCardContent() {
  return (
    <div className="space-y-3">
      <ShimmerBlock width="8rem" height="1rem" />
      <ShimmerBlock width="100%" height="0.875rem" delay={100} />
      <ShimmerBlock width="75%" height="0.875rem" delay={200} />
    </div>
  );
}

function DefaultPageContent() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

/** Admin dashboard full page skeleton. */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <ShimmerBlock width="10rem" height="0.75rem" delay={0} />
        <ShimmerBlock width="16rem" height="2rem" delay={50} />
        <ShimmerBlock width="80%" height="1rem" delay={100} />
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Chart + quick links */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton>
          <div className="space-y-4">
            <ShimmerBlock width="8rem" height="1rem" />
            <ShimmerBlock width="12rem" height="0.75rem" delay={50} />
            <ChartSkeleton height="280px" />
          </div>
        </CardSkeleton>
        <CardSkeleton>
          <div className="space-y-4">
            <ShimmerBlock width="7rem" height="1rem" />
            <ShimmerBlock width="10rem" height="0.75rem" delay={50} />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerBlock key={i} width="100%" height="2.5rem" borderRadius="0.75rem" delay={i * 50 + 100} />
              ))}
            </div>
          </div>
        </CardSkeleton>
      </div>
    </div>
  );
}

/** Employee dashboard full page skeleton. */
export function EmployeeDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <ShimmerBlock width="6rem" height="0.75rem" delay={0} />
        <ShimmerBlock width="12rem" height="2.25rem" delay={50} />
        <ShimmerBlock width="60%" height="1rem" delay={100} />
      </div>

      {/* Primary actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShimmerBlock width="2.5rem" height="2.5rem" borderRadius="0.75rem" />
              <div className="flex-1">
                <ShimmerBlock width="8rem" height="1rem" />
                <ShimmerBlock width="10rem" height="0.75rem" className="mt-1" delay={50} />
              </div>
            </div>
            <ShimmerBlock width="100%" height="0.5rem" delay={100} />
          </div>
        </CardSkeleton>
        <CardSkeleton>
          <div className="space-y-3">
            <ShimmerBlock width="9rem" height="1rem" />
            {Array.from({ length: 3 }).map((_, i) => (
              <ShimmerBlock key={i} width="100%" height="0.875rem" delay={i * 50 + 50} />
            ))}
          </div>
        </CardSkeleton>
      </div>

      {/* Chart row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton>
          <ChartSkeleton height="260px" />
        </CardSkeleton>
        <CardSkeleton>
          <ChartSkeleton height="260px" />
        </CardSkeleton>
      </div>

      {/* Tabs area */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} width="6rem" height="2rem" borderRadius="0.5rem" delay={i * 50} />
          ))}
        </div>
        <CardSkeleton>
          <ChartSkeleton height="380px" />
        </CardSkeleton>
      </div>

      {/* Recent assessments */}
      <CardSkeleton>
        <TableRowSkeleton count={3} />
      </CardSkeleton>
    </div>
  );
}

/** Training / learning page skeleton. */
export function TrainingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <ShimmerBlock width="6rem" height="0.75rem" />
        <ShimmerBlock width="10rem" height="2rem" delay={50} />
        <ShimmerBlock width="18rem" height="1rem" delay={100} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i}>
            <div className="space-y-4">
              <ShimmerBlock width="70%" height="1.25rem" />
              <ShimmerBlock width="50%" height="0.75rem" delay={50} />
              <ShimmerBlock width="100%" height="0.5rem" delay={100} />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <ShimmerBlock key={j} width="100%" height="3.5rem" borderRadius="0.75rem" delay={j * 50 + 150} />
                ))}
              </div>
            </div>
          </CardSkeleton>
        ))}
      </div>
    </div>
  );
}

/** Assessments list page skeleton. */
export function AssessmentsPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <ShimmerBlock width="12rem" height="2rem" />
          <ShimmerBlock width="16rem" height="0.875rem" delay={50} />
        </div>
        <ShimmerBlock width="6rem" height="2.5rem" borderRadius="0.5rem" />
      </div>
      <div className="space-y-3">
        <ShimmerBlock width="8rem" height="1rem" />
        <TableRowSkeleton count={3} />
      </div>
    </div>
  );
}

/** Super admin page skeleton. */
export function SuperAdminSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <ShimmerBlock width="7rem" height="0.75rem" />
        <ShimmerBlock width="8rem" height="2rem" delay={50} />
        <ShimmerBlock width="16rem" height="1rem" delay={100} />
      </div>
      <CardSkeleton>
        <div className="space-y-3">
          <ShimmerBlock width="10rem" height="1.25rem" />
          <ShimmerBlock width="80%" height="0.875rem" delay={50} />
          <ShimmerBlock width="8rem" height="2.5rem" borderRadius="0.5rem" delay={100} />
        </div>
      </CardSkeleton>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i}>
            <ShimmerBlock width="10rem" height="0.75rem" />
            <ShimmerBlock width="4rem" height="2.25rem" className="mt-2" delay={50} />
            <ShimmerBlock width="12rem" height="0.75rem" className="mt-2" delay={100} />
          </CardSkeleton>
        ))}
      </div>
    </div>
  );
}

/** Login page skeleton — matches the glass card styling. */
export function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030305] p-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/[0.15] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
        <div className="space-y-6">
          <ShimmerBlock width="70%" height="1.75rem" />
          <ShimmerBlock width="90%" height="0.875rem" delay={50} />
          <div className="space-y-2">
            <ShimmerBlock width="3rem" height="0.75rem" delay={100} />
            <ShimmerBlock width="100%" height="2.5rem" borderRadius="0.5rem" delay={150} />
          </div>
          <div className="space-y-2">
            <ShimmerBlock width="5rem" height="0.75rem" delay={200} />
            <ShimmerBlock width="100%" height="2.5rem" borderRadius="0.5rem" delay={250} />
          </div>
          <ShimmerBlock width="100%" height="2.75rem" borderRadius="0.625rem" delay={300} />
        </div>
      </div>
    </div>
  );
}

/* Shimmer animation (CSS-in-JS — Tailwind can"t animate arbitrary backgrounds) */
const style = typeof document !== "undefined" ? document.createElement("style") : null;
if (style && !style.sheet?.cssRules?.length) {
  style.textContent = `
    @keyframes shimmer-move {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head?.appendChild(style);
}