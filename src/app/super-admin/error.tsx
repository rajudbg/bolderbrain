"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function SuperAdminError({
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
      title="Super admin area could not load"
      description="Retry this platform section or return home while the rest of the app stays isolated."
    />
  );
}
