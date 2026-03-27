"use client";

import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function DashboardEmpty({
  tenants,
  isOrgAdmin,
}: {
  tenants: { slug: string; name: string }[];
  isOrgAdmin: boolean;
}) {
  const first = tenants[0];

  return (
    <div className="from-muted/30 to-background relative overflow-hidden rounded-3xl border border-dashed bg-gradient-to-br p-10 text-center shadow-inner">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl shadow-sm">
          <Sparkles className="size-7" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Your behavior profile will appear here</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Once your organization runs a 360 behavioral assessment and every rater has submitted, you will see your
          competency radar, gap analysis, and personalized insights.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          {isOrgAdmin && first ? (
            <Link href={`/org/${first.slug}/assessments`} className={buttonVariants()}>
              Schedule a 360
            </Link>
          ) : null}
          <a
            href="mailto:?subject=360%20feedback%20request&body=Hi%2C%20I%27d%20like%20to%20request%20a%20360%20behavioral%20assessment%20when%20possible."
            className={cn(
              buttonVariants({ variant: isOrgAdmin && first ? "outline" : "default" }),
              "inline-flex items-center gap-2",
            )}
          >
            <Mail className="size-4" />
            Email my admin
          </a>
        </div>
        {!isOrgAdmin && (
          <p className="text-muted-foreground pt-2 text-xs">
            Tip: ask your HR or people partner to enable a 360 for your role.
          </p>
        )}
      </div>
    </div>
  );
}
