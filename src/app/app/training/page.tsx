import { Suspense } from "react";
import { listMyTrainingEnrollments } from "./actions";
import { MyLearningClient } from "./my-learning-client";
import { TrainingPageSkeleton } from "@/components/ui/skeleton-loading";

export default async function MyLearningPage() {
  return (
    <Suspense fallback={<TrainingPageSkeleton />}>
      <MyLearningContent />
    </Suspense>
  );
}

async function MyLearningContent() {
  const rows = await listMyTrainingEnrollments();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Employee</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight">My learning</h1>
        <p className="text-body-cerebral max-w-2xl">
          Pre and training post. Your growth journey in one place.
        </p>
      </header>
      <MyLearningClient rows={rows} />
    </div>
  );
}