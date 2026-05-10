"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function TrainingError({
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
      title="Training could not load"
      description="The learning area hit a temporary issue. Retry this section without losing the rest of the app."
    />
  );
}
