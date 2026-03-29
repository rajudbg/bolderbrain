import {
  Clock,
  Cpu,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { getAIMetrics, healthStatusFromMetrics } from "@/lib/ai/metrics";
import { PRIMARY_MODEL } from "@/lib/ai/openrouter";
import { cn } from "@/lib/utils";
import { AISparkleIcon } from "@/components/icons/ai-sparkle";

export default async function SuperAdminAiHealthPage() {
  await requirePlatformSuperAdmin();
  const m = await getAIMetrics();
  const status = healthStatusFromMetrics(m);

  const statusLabel =
    status === "green" ? "Healthy" : status === "yellow" ? "Watch" : "Attention";

  const aiOk = m.aiSuccessRate >= 90;
  const latOk = m.averageLatencyMs < 3000;
  const ratingLabel =
    m.userSatisfaction != null ? `${m.userSatisfaction.toFixed(2)} / 5` : "—";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Super Admin</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight">Neural Intelligence Layer</h1>
        <p className="text-body-cerebral max-w-2xl">
          Aurora-branded health for Nemotron and rule-based fallback. Metrics reflect persisted 360 insights (last 24h).
        </p>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 ai-aurora-bg p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "linear-gradient(110deg, rgba(6,182,212,0.12) 0%, transparent 42%, rgba(59,130,246,0.08) 100%)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/20">
            <Sparkles className="size-7 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white/95">System status</h2>
            <p className="text-sm text-white/50">
              {statusLabel} — AI success {m.aiSuccessRate.toFixed(1)}% · latency {m.averageLatencyMs}ms · fallback{" "}
              {m.fallbackRate.toFixed(1)}%
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
            <AISparkleIcon className="size-5" />
            <span className="font-heading text-white/85">Neural layer</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="AI success rate"
          value={`${m.aiSuccessRate.toFixed(1)}%`}
          subtitle="Nemotron + cache"
          trend={aiOk ? "up" : "down"}
          color="cyan"
          icon={Zap}
        />
        <MetricCard
          title="Avg latency"
          value={`${m.averageLatencyMs} ms`}
          subtitle="Generation time"
          trend={latOk ? "up" : "down"}
          color="blue"
          icon={Clock}
        />
        <MetricCard
          title="User rating"
          value={ratingLabel}
          subtitle="Avg thumbs feedback"
          trend="up"
          color="teal"
          icon={Star}
        />
        <MetricCard
          title="Cost"
          value={m.costPerInsight}
          subtitle="Nemotron free tier"
          trend="neutral"
          color="slate"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-medium text-white/80">Throughput (24h)</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-[#0A0A0C] p-3 ring-1 ring-white/5">
              <p className="text-xs text-white/45">Total insights</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white/90">{m.totalInsights}</p>
            </div>
            <div className="rounded-lg bg-[#0A0A0C] p-3 ring-1 ring-white/5">
              <p className="text-xs text-white/45">Cache hit rate</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white/90">
                {m.cacheHitRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-[#0A0A0C] p-3 ring-1 ring-white/5">
              <p className="text-xs text-white/45">Rule fallback</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white/90">
                {m.fallbackRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-[#0A0A0C] p-3 ring-1 ring-white/5">
              <p className="text-xs text-white/45">Status band</p>
              <p className="mt-1 text-sm font-medium text-white/85">{statusLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-[#0A0A0C] p-4">
          <h3 className="mb-3 text-sm font-medium text-white/80">Active model</h3>
          <div className="flex items-center gap-3 rounded-lg border border-cyan-500/15 bg-[#0A0A0C] p-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Cpu className="size-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white">Nemotron-3 Super 120B</div>
              <div className="truncate text-xs text-white/50">{PRIMARY_MODEL}</div>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Operational
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            Green: AI success &gt; 90% and latency &lt; 3s. Yellow: mixed or no data. Red: AI success &lt; 70% or fallback &gt;
            30%.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down" | "neutral";
  color: "cyan" | "blue" | "teal" | "slate";
  icon: LucideIcon;
}) {
  const colorRing =
    color === "cyan"
      ? "ring-cyan-500/25"
      : color === "blue"
        ? "ring-blue-500/25"
        : color === "teal"
          ? "ring-teal-500/25"
          : "ring-slate-500/20";

  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 ring-1",
        colorRing,
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-cyan-500/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-caption-cerebral text-[10px] uppercase tracking-wider text-white/45">{title}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white/90">{value}</p>
          <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
            <Icon className="size-4" />
          </div>
          {trend !== "neutral" && (
            <TrendIcon
              className={cn(
                "size-4",
                trend === "up" ? "text-emerald-400/90" : "text-amber-400/90",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
