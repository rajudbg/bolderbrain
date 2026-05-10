"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Dashboard could not load"
      description="A dashboard widget or data request failed. Retry without leaving your workspace."
    />
  );
}
