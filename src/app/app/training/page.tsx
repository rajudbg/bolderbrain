import { listMyTrainingEnrollments } from "./actions";
import { MyLearningClient } from "./my-learning-client";

export default async function MyLearningPage() {
  const rows = await listMyTrainingEnrollments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-indigo-200 to-amber-200 bg-clip-text md:text-3xl">
          My learning
        </h1>
        <p className="mt-1 text-sm text-white/55">Pre → training → post. Your growth journey in one place.</p>
      </div>
      <MyLearningClient rows={rows} />
    </div>
  );
}
