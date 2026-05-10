"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RouteErrorState({
  error,
  reset,
  title = "This section could not load",
  description = "Try again, or continue somewhere else while we recover this area.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          {error.digest ? (
            <p className="text-muted-foreground mt-2 text-xs">Reference: {error.digest}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href="/"
            className="border-border bg-background hover:bg-muted inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
