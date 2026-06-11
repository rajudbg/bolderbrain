import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getReviewForSelf } from '@/lib/reviews';

export default async function SelfReviewPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const review = await getReviewForSelf(session.user.id, cycleId);
  if (!review) {
    return (
      <div className="p-6 text-center text-white/50">
        Review record not found.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <header>
        <p className="text-caption-cerebral">Self-Review</p>
        <h1 className="text-gradient-heading text-4xl">{review.cycle.name}</h1>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="text-xl font-semibold text-white/90 mb-6">Performance Summary</h2>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-white/70 mb-2 block">Self Rating (1-{review.cycle.maxRating})</label>
            <div className="text-white/50 text-sm">Use the UI to rate your performance...</div>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-2 block">Written Summary</label>
            <textarea 
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/90 min-h-[150px]"
              placeholder="Summarize your achievements..."
              readOnly
              value={review.selfSummary || ''}
            />
          </div>
          <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {review.status === 'NOT_STARTED' ? 'Submit Self-Review' : 'Submitted'}
          </button>
        </div>
      </div>
    </div>
  );
}
