"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const MU = 100;
const SD = 15;

function normalPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

export function IqBellCurve({ userScore }: { userScore: number }) {
  const data = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let x = 55; x <= 145; x += 1) {
      pts.push({ x, y: normalPdf(x, MU, SD) });
    }
    return pts;
  }, []);

  const clamped = Math.min(145, Math.max(55, userScore));
  const yAt = normalPdf(clamped, MU, SD);

  return (
    <div
      className="relative h-[min(320px,55vh)] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F11]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),
          linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),
          radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(99,102,241,0.08),transparent)
        `,
        backgroundSize: "40px 40px, 40px 40px, auto",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="iqFillCerebral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="iqStrokeCerebral" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[55, 145]}
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
          />
          <YAxis hide domain={[0, "auto"]} />
          <ReferenceArea x1={55} x2={90} strokeOpacity={0} fill="rgb(239 68 68)" fillOpacity={0.1} />
          <ReferenceArea x1={90} x2={110} strokeOpacity={0} fill="rgb(234 179 8)" fillOpacity={0.08} />
          <ReferenceArea x1={110} x2={145} strokeOpacity={0} fill="rgb(34 197 94)" fillOpacity={0.1} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="url(#iqStrokeCerebral)"
            strokeWidth={2}
            fill="url(#iqFillCerebral)"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={clamped}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <ReferenceDot
            x={clamped}
            y={yAt}
            r={0}
            fill="none"
            stroke="none"
            shape={(props: { cx?: number; cy?: number }) => {
              const cx = props.cx ?? 0;
              const cy = props.cy ?? 0;
              return (
                <g className="will-change-transform">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill="none"
                    stroke="rgba(99,102,241,0.45)"
                    strokeWidth={1.5}
                    className="animate-pulse"
                  />
                  <circle cx={cx} cy={cy} r={10} fill="none" stroke="rgba(236,72,153,0.35)" strokeWidth={1} />
                  <circle cx={cx} cy={cy} r={5} fill="#6366f1" stroke="#fafafa" strokeWidth={2} />
                </g>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
