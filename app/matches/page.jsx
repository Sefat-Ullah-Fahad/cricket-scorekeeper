import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import MatchesClient from './MatchesClient';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('cricket_session')?.value;

  if (!token) {
    redirect('/login');
  }

  const sessionResult = await getSession(token);
  if (!sessionResult || !sessionResult.user) {
    redirect('/login');
  }

  const user = sessionResult.user;

  // STRICT PRIVACY: Fetch ONLY authenticated user's matches
  const { db } = await connectToDatabase();
  const rawMatches = await db.collection('matches')
    .find({ ownerId: user.id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  const matches = rawMatches.map(m => ({
    ...m,
    id: m._id ? m._id.toString() : m.id,
    _id: undefined,
  }));

  return <MatchesClient user={user} initialMatches={matches} />;
}
