"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function AdminError({
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
      title="Admin area could not load"
      description="Your session is still active. Retry this admin section or move to another area."
    />
  );
}
