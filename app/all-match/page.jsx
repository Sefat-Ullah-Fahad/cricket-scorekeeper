import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MdSportsCricket } from 'react-icons/md';
import { FiClock } from 'react-icons/fi';

const SESSION_COOKIE_NAME = 'cricket_session';

const LIVE_LIKE_STATUSES = ['LIVE', 'INNINGS_BREAK', 'LUNCH_BREAK', 'TEA_BREAK', 'STUMPS'];

function statusBadge(status) {
  const map = {
    LIVE: { label: 'LIVE', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    INNINGS_BREAK: { label: 'INNINGS BREAK', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    LUNCH_BREAK: { label: 'LUNCH BREAK', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    TEA_BREAK: { label: 'TEA BREAK', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    STUMPS: { label: 'STUMPS', cls: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
    COMPLETED: { label: 'COMPLETED', cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  };
  return map[status] || { label: status || 'UNKNOWN', cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
}

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect('/login');
  const result = await getSession(token);
  if (!result) redirect('/login');
  return result.user;
}

export default async function AllMatchPage() {
  // Still requires login to view — but no longer filters by ownership.
  await requireUser();

  const { db } = await connectToDatabase();

  // NOTE: intentionally no { ownerId } filter here — this page is meant to
  // show every match in the database, from every user, since the app will
  // be shared with other scorers.
  const rawMatches = await db.collection('matches').find({}).toArray();

  const matches = rawMatches
    .map((m) => ({
      id: m._id ? m._id.toString() : m.id,
      teamA: m.teamA,
      teamB: m.teamB,
      overs: m.overs,
      status: m.status,
      result: m.result,
      currentInnings: m.currentInnings,
      innings1: m.innings1,
      innings2: m.innings2,
      updatedAt: m.updatedAt,
    }))
    .sort((a, b) => {
      const aLive = LIVE_LIKE_STATUSES.includes(a.status) ? 0 : 1;
      const bLive = LIVE_LIKE_STATUSES.includes(b.status) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

  return (
    <div className="max-w-5xl mx-auto py-6 px-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
          <MdSportsCricket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">All Match</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Read-only view of every match on the platform — live matches appear first.
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
          No matches found yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matches.map((m) => {
            const inn = m.currentInnings === 2 && m.innings2 ? m.innings2 : m.innings1;
            const badge = statusBadge(m.status);
            const overStr = inn ? `${Math.floor((inn.legalBalls || 0) / 6)}.${(inn.legalBalls || 0) % 6}` : '0.0';

            return (
              <Link
                key={m.id}
                href={`/all-match/${m.id}`}
                className="block p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {m.overs} Overs per Innings
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{m.teamA}</span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                      {m.innings1 ? `${m.innings1.score}/${m.innings1.wickets}` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{m.teamB}</span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                      {m.innings2 ? `${m.innings2.score}/${m.innings2.wickets}` : '-'}
                    </span>
                  </div>
                </div>

                {inn && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                    <span>{inn.battingTeam} batting</span>
                    <span className="font-mono">({overStr} ov)</span>
                  </div>
                )}

                {m.status === 'COMPLETED' && m.result && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {m.result}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}