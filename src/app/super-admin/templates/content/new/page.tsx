import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePlatformSuperAdmin } from "@/lib/super-admin-auth";
import { ContentTemplateBuilder } from "./content-template-builder";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewTrainingContentTemplatePage() {
  await requirePlatformSuperAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <Link
          href="/super-admin/templates"
          className={cn(buttonVariants({ variant: "ghost" }), "mb-4 inline-flex items-center gap-2 text-white/70")}
        >
          <ArrowLeft className="size-4" />
          Templates
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white/95">Training content template</h1>
        <p className="mt-2 text-sm text-white/55">
          Build flexible knowledge or behavioral assessments (5–50 questions). Published templates are available to HR when
          creating training programs.
        </p>
      </div>
      <ContentTemplateBuilder />
    </div>
  );
}
