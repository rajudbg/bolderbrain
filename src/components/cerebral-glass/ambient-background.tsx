"use client";

/**
 * Fixed ambient aurora gradient — Premium Glassmorphism background layer.
 */
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden aurora-bg"
      aria-hidden
    />
  );
}
