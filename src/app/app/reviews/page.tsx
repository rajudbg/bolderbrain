import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMyReviews } from '@/lib/reviews';
import { MyReviewsClient } from './my-reviews-client';

export default async function MyReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const reviews = await getMyReviews(session.user.id);

  return (
    <div className="space-y-8 p-6">
      <header>
        <p className="text-caption-cerebral">Performance</p>
        <h1 className="text-gradient-heading text-4xl">My Reviews</h1>
        <p className="text-body-cerebral mt-1">Your performance review history and open cycles.</p>
      </header>
      <MyReviewsClient reviews={reviews} />
    </div>
  );
}
