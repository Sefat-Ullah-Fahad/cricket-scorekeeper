import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req, { params }) {
  try {
    const { shareToken } = params;
    if (!shareToken) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const match = await db.collection('matches').findOne({ shareToken });

    if (!match) {
      return NextResponse.json({ error: 'Match not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (!match.shareEnabled) {
      return NextResponse.json({
        error: 'Live score sharing is currently disabled by match owner.',
        code: 'SHARING_DISABLED'
      }, { status: 403 });
    }

    // STRICT SANITIZATION: Expose ONLY public scoreboard data
    const publicData = {
      teamA: match.teamA,
      teamB: match.teamB,
      overs: match.overs,
      battingFirst: match.battingFirst,
      currentInnings: match.currentInnings,
      target: match.target,
      status: match.status,
      result: match.result,
      innings1: match.innings1,
      innings2: match.innings2,
      updatedAt: match.updatedAt,
      shareToken: match.shareToken,
    };

    return NextResponse.json({ match: publicData });
  } catch (err) {
    console.error('[PUBLIC API ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
