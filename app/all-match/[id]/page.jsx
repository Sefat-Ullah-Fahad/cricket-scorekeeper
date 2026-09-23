import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { getSession } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import LiveMatchClient from './LiveMatchClient';

const SESSION_COOKIE_NAME = 'cricket_session';

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect('/login');
  const result = await getSession(token);
  if (!result) redirect('/login');
  return result.user;
}

export default async function AllMatchDetailPage({ params }) {
  await requireUser();
  const { id } = params;

  const { db } = await connectToDatabase();
  let query;
  try {
    query = { _id: id.length === 24 ? new ObjectId(id) : id };
  } catch (err) {
    notFound();
  }

  const rawMatch = await db.collection('matches').findOne(query);
  if (!rawMatch) notFound();

  const initialMatch = { ...rawMatch, id: rawMatch._id.toString(), _id: undefined };

  return (
    <div className="max-w-4xl mx-auto py-6 px-1 space-y-5">
      <Link
        href="/all-match"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>Back to All Match</span>
      </Link>

      <LiveMatchClient initialMatch={initialMatch} matchId={id} />
    </div>
  );
}