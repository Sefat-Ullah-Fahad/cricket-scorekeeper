import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { processScoringAction } from '@/lib/cricket-engine';
import { broadcastMatchUpdate } from '@/lib/realtime';

export async function POST(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    if (!action || !action.type) {
      return NextResponse.json({ error: 'Valid scoring action required' }, { status: 400 });
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

    const updatedMatch = processScoringAction(match, action);
    updatedMatch.updatedAt = new Date();

    await db.collection('matches').updateOne(query, {
      $set: {
        innings1: updatedMatch.innings1,
        innings2: updatedMatch.innings2,
        currentInnings: updatedMatch.currentInnings,
        target: updatedMatch.target,
        status: updatedMatch.status,
        result: updatedMatch.result,
        stateHistory: updatedMatch.stateHistory,
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
    console.error('[SCORING ERROR]', err.message);
    return NextResponse.json({ error: err.message || 'Scoring action failed' }, { status: 400 });
  }
}
