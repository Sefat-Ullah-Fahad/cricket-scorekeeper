import { connectToDatabase } from '@/lib/mongodb';
import { MdSportsCricket } from 'react-icons/md';
import { FiAlertCircle, FiLock } from 'react-icons/fi';
import LiveViewerClient from './LiveViewerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { shareToken } = params;
  try {
    const { db } = await connectToDatabase();
    const match = await db.collection('matches').findOne({ shareToken });
    if (!match) {
      return { title: 'Cricket Match Not Found' };
    }
    const title = `${match.teamA} vs ${match.teamB} - Live Cricket Score`;
    const description = `Live ball-by-ball scorecard between ${match.teamA} and ${match.teamB}.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch (e) {
    return { title: 'Live Cricket Score' };
  }
}

export default async function LiveViewerPage({ params }) {
  const { shareToken } = params;

  const { db } = await connectToDatabase();
  const rawMatch = await db.collection('matches').findOne({ shareToken });

  if (!rawMatch) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Match Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1">This live match link is invalid or has expired.</p>
      </div>
    );
  }

  if (!rawMatch.shareEnabled) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <FiLock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Live Sharing Paused</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          The scorer of {rawMatch.teamA} vs {rawMatch.teamB} has temporarily turned off live score sharing for this match.
        </p>
      </div>
    );
  }

  // STRICT SANITIZATION: Expose ONLY public scoreboard data
  const publicMatch = {
    teamA: rawMatch.teamA,
    teamB: rawMatch.teamB,
    overs: rawMatch.overs,
    battingFirst: rawMatch.battingFirst,
    currentInnings: rawMatch.currentInnings,
    target: rawMatch.target,
    status: rawMatch.status,
    result: rawMatch.result,
    innings1: rawMatch.innings1,
    innings2: rawMatch.innings2,
    shareToken: rawMatch.shareToken,
    updatedAt: rawMatch.updatedAt,
  };

  return <LiveViewerClient initialMatch={publicMatch} shareToken={shareToken} />;
}
