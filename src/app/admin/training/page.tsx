import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { listTrainingPrograms } from "./actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function AdminTrainingListPage() {
  const programs = await listTrainingPrograms();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text md:text-3xl">
            Training Impact
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Pre/post paired assessments with cohort deltas — prove ROI on every program.
          </p>
        </div>
        <Link
          href="/admin/training/new"
          className={cn(
            buttonVariants(),
            "inline-flex bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-95",
          )}
        >
          <Plus className="mr-2 size-4" />
          New program
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <GraduationCap className="mx-auto size-12 text-amber-400/50" />
          <p className="mt-4 text-sm text-white/50">No training programs yet.</p>
          <Link href="/admin/training/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
            Create your first program
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/45">
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Training date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.06] text-white/85 last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-white/55">{p.trainingDate.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-white/20 text-white/70">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-white/55">{p._count.enrollments}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/training/${p.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-amber-200/90 hover:text-amber-100",
                      )}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
