import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { getSession } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';

const SESSION_COOKIE_NAME = 'cricket_session';

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect('/login');
  const result = await getSession(token);
  if (!result) redirect('/login');
  return result.user;
}

function InningsCard({ title, inn }) {
  if (!inn) return null;
  const overStr = `${Math.floor((inn.legalBalls || 0) / 6)}.${(inn.legalBalls || 0) % 6}`;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{title}</h3>
        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {inn.score}/{inn.wickets} ({overStr} ov)
        </div>
      </div>

      {/* Batters table */}
      <div>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <span>Batter</span>
          <span>R</span>
          <span>B</span>
          <span>4s</span>
          <span>6s</span>
        </div>
        {(inn.batters || []).map((b, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs py-1.5 border-b border-zinc-50 dark:border-zinc-800/60">
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">{b.name}</div>
              {b.dismissal && <div className="text-[10px] text-zinc-400">{b.dismissal}</div>}
            </div>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{b.runs}</span>
            <span className="font-mono text-zinc-500">{b.balls}</span>
            <span className="font-mono text-zinc-500">{b.fours}</span>
            <span className="font-mono text-zinc-500">{b.sixes}</span>
          </div>
        ))}
      </div>

      {/* Bowlers table */}
      <div>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-zinc-100 dark:border-zinc-800 mt-3">
          <span>Bowler</span>
          <span>O</span>
          <span>R</span>
          <span>W</span>
          <span>Econ</span>
        </div>
        {(inn.bowlers || []).map((bw, idx) => {
          const bOvers = `${Math.floor((bw.legalBalls || 0) / 6)}.${(bw.legalBalls || 0) % 6}`;
          const econ = bw.legalBalls > 0 ? ((bw.runsConceded / bw.legalBalls) * 6).toFixed(2) : '0.00';
          return (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs py-1.5 border-b border-zinc-50 dark:border-zinc-800/60">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{bw.name}</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">{bOvers}</span>
              <span className="font-mono text-zinc-500">{bw.runsConceded}</span>
              <span className="font-mono text-zinc-500">{bw.wickets}</span>
              <span className="font-mono text-zinc-500">{econ}</span>
            </div>
          );
        })}
      </div>

      {/* Extras & fall of wickets */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 space-y-1">
        <div>
          Extras: {inn.extras?.total || 0}
          {' '}(wd {inn.extras?.wides || 0}, nb {inn.extras?.noBalls || 0}, b {inn.extras?.byes || 0}, lb {inn.extras?.legByes || 0})
        </div>
        {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
          <div>
            Fall of wickets: {inn.fallOfWickets.map((fw, i) => (
              <span key={i}>
                {fw.wicket}-{fw.score} ({fw.player}, {fw.overs}){i < inn.fallOfWickets.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AllMatchDetailPage({ params }) {
  const user = await requireUser();
  const { id } = params;

  const { db } = await connectToDatabase();
  const query = { _id: id.length === 24 ? new ObjectId(id) : id };
  const match = await db.collection('matches').findOne(query);

  if (!match) notFound();
  if (match.ownerId !== user.id.toString()) notFound();

  return (
    <div className="max-w-4xl mx-auto py-6 px-1 space-y-5">
      <Link
        href="/all-match"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>Back to All Match</span>
      </Link>

      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border border-emerald-500/30 text-white shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-extrabold text-zinc-200 uppercase tracking-wide">
            {match.teamA} vs {match.teamB}
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-zinc-700/40 text-zinc-200 border border-zinc-600/40">
            {match.status}
          </span>
        </div>
        <div className="text-xs text-zinc-400">{match.overs} overs per innings</div>
        {match.status === 'COMPLETED' && match.result && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center text-sm font-bold text-emerald-300">
            {match.result}
          </div>
        )}
      </div>

      <InningsCard
        title={`${match.innings1?.battingTeam || match.teamA} Innings (1st Innings)`}
        inn={match.innings1}
      />
      {match.innings2 && (
        <InningsCard
          title={`${match.innings2.battingTeam} Innings (2nd Innings)`}
          inn={match.innings2}
        />
      )}

      <p className="text-center text-[11px] text-zinc-400 pt-2">
        Read-only view — scoring and editing are not available here.
      </p>
    </div>
  );
}