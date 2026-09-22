import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { startSecondInnings } from '@/lib/cricket-engine';
import { broadcastMatchUpdate } from '@/lib/realtime';

export async function POST(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { striker, nonStriker, bowler } = body;

    if (!striker || !nonStriker || !bowler) {
      return NextResponse.json({ error: 'Striker, non-striker, and bowler are required for 2nd innings.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const query = { _id: id.length === 24 ? new ObjectId(id) : id };
    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedMatch = startSecondInnings(match, striker.trim(), nonStriker.trim(), bowler.trim());
    updatedMatch.updatedAt = new Date();

    await db.collection('matches').updateOne(query, {
      $set: {
        currentInnings: 2,
        innings2: updatedMatch.innings2,
        status: updatedMatch.status,
        updatedAt: updatedMatch.updatedAt,
      }
    });

    const safeMatch = {
      ...updatedMatch,
      id: updatedMatch._id ? updatedMatch._id.toString() : updatedMatch.id,
      _id: undefined,
    };

    if (safeMatch.shareEnabled && safeMatch.shareToken) {
      broadcastMatchUpdate(safeMatch.shareToken, safeMatch);
    }

    return NextResponse.json({ success: true, match: safeMatch });
  } catch (err) {
    console.error('[INNINGS ERROR]', err.message);
    return NextResponse.json({ error: err.message || 'Failed to start 2nd innings' }, { status: 400 });
  }
}
