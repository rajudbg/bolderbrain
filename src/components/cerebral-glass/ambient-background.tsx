"use client";

/**
 * Fixed ambient gradient orbs — Cerebral Glass signature layer (z-index below app content).
 */
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="cerebral-orb cerebral-orb-a absolute -left-[20%] top-[10%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="cerebral-orb cerebral-orb-b absolute -right-[15%] top-[40%] h-[min(60vw,480px)] w-[min(60vw,480px)] rounded-full bg-fuchsia-600/20 blur-[120px]" />
      <div className="cerebral-orb cerebral-orb-c absolute bottom-[5%] left-[25%] h-[min(50vw,400px)] w-[min(50vw,400px)] rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
    </div>
  );
}
