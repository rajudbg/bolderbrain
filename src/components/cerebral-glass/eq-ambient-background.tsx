"use client";

/** Warm amber/orange ambient layer for EQ surfaces (distinct from indigo Cerebral default). */
export function EqAmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-[18%] top-[12%] h-[min(65vw,520px)] w-[min(65vw,520px)] rounded-full bg-orange-500/20 blur-[120px]" />
      <div className="absolute -right-[12%] top-[35%] h-[min(55vw,440px)] w-[min(55vw,440px)] rounded-full bg-amber-500/15 blur-[100px]" />
      <div className="absolute bottom-[8%] left-[20%] h-[min(45vw,360px)] w-[min(45vw,360px)] rounded-full bg-amber-500/10 blur-[90px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(251,146,60,0.12),transparent_55%)]" />
    </div>
  );
}
