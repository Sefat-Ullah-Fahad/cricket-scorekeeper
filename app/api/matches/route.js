import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { createInningsState } from '@/lib/cricket-engine';
import crypto from 'crypto';

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    // STRICT PRIVACY: Query strictly by authenticated user's ID
    const matches = await db.collection('matches')
      .find({ ownerId: user.id.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    const safeMatches = matches.map(m => ({
      ...m,
      id: m._id ? m._id.toString() : m.id,
      _id: undefined,
    }));

    return NextResponse.json({ matches: safeMatches });
  } catch (err) {
    console.error('[MATCH ERROR] Fetch matches failed:', err);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      teamA,
      teamB,
      overs = 20,
      battingFirst,
      striker,
      nonStriker,
      bowler,
      teamAPlayers = [],
      teamBPlayers = [],
    } = body;

    if (!teamA || !teamB) {
      return NextResponse.json({ error: 'Team A and Team B names are required.' }, { status: 400 });
    }
    if (!striker || !nonStriker || !bowler) {
      return NextResponse.json({ error: 'Opening striker, non-striker, and bowler are required.' }, { status: 400 });
    }
    if (striker.trim().toLowerCase() === nonStriker.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Striker and Non-striker must be different players.' }, { status: 400 });
    }

    const totalOvers = Math.max(1, Math.min(100, Number(overs) || 20));
    const battingTeam = battingFirst === 'Team B' ? teamB.trim() : teamA.trim();
    const bowlingTeam = battingFirst === 'Team B' ? teamA.trim() : teamB.trim();

    const innings1 = createInningsState(
      battingTeam,
      bowlingTeam,
      totalOvers,
      striker.trim(),
      nonStriker.trim(),
      bowler.trim()
    );

    const shareToken = crypto.randomBytes(16).toString('hex');
    const now = new Date();

    const matchDoc = {
      ownerId: user.id.toString(),
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      overs: totalOvers,
      battingFirst,
      teamAPlayers,
      teamBPlayers,
      currentInnings: 1,
      target: null,
      status: 'LIVE',
      result: null,
      shareEnabled: false,
      shareToken,
      innings1,
      innings2: null,
      stateHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    const { db } = await connectToDatabase();
    const result = await db.collection('matches').insertOne(matchDoc);

    const createdMatch = {
      ...matchDoc,
      id: result.insertedId.toString(),
      _id: undefined,
    };

    return NextResponse.json({ success: true, match: createdMatch }, { status: 201 });
  } catch (err) {
    console.error('[MATCH ERROR] Create match failed:', err);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
