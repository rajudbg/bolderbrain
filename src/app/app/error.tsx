"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function EmployeeAppError({
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
      title="Workspace area could not load"
      description="Retry this section. Other parts of the app remain available."
    />
  );
}
