import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import Link from 'next/link';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import ScorerClient from './ScorerClient';

export const dynamic = 'force-dynamic';

export default async function MatchScorerPage({ params }) {
  const { id } = params;
  const cookieStore = cookies();
  const token = cookieStore.get('cricket_session')?.value;

  if (!token) {
    redirect(`/login?next=/matches/${id}`);
  }

  const sessionResult = await getSession(token);
  if (!sessionResult || !sessionResult.user) {
    redirect(`/login?next=/matches/${id}`);
  }

  const user = sessionResult.user;

  const { db } = await connectToDatabase();
  const query = { _id: id.length === 24 ? new ObjectId(id) : id };
  const rawMatch = await db.collection('matches').findOne(query);

  if (!rawMatch) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Match Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">The requested match does not exist or may have been deleted.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // STRICT OWNERSHIP ENFORCEMENT
  if (rawMatch.ownerId !== user.id.toString()) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Access Restricted</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          You do not have permission to score this match. Only the creator of the match can access the scoring pad.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Your Dashboard</span>
        </Link>
      </div>
    );
  }

  const match = {
    ...rawMatch,
    id: rawMatch._id ? rawMatch._id.toString() : rawMatch.id,
    _id: undefined,
  };

  return <ScorerClient initialMatch={match} user={user} />;
}
