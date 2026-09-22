import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { undoLastScoringAction } from '@/lib/cricket-engine';
import { broadcastMatchUpdate } from '@/lib/realtime';

export async function POST(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { db } = await connectToDatabase();
    const query = { _id: id.length === 24 ? new ObjectId(id) : id };
    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const revertedMatch = undoLastScoringAction(match);
    revertedMatch.updatedAt = new Date();

    await db.collection('matches').updateOne(query, {
      $set: {
        innings1: revertedMatch.innings1,
        innings2: revertedMatch.innings2,
        currentInnings: revertedMatch.currentInnings,
        target: revertedMatch.target,
        status: revertedMatch.status,
        result: revertedMatch.result,
        stateHistory: revertedMatch.stateHistory,
        updatedAt: revertedMatch.updatedAt,
      }
    });

    const safeMatch = {
      ...revertedMatch,
      id: revertedMatch._id ? revertedMatch._id.toString() : revertedMatch.id,
      _id: undefined,
    };

    if (safeMatch.shareEnabled && safeMatch.shareToken) {
      broadcastMatchUpdate(safeMatch.shareToken, safeMatch);
    }

    return NextResponse.json({ success: true, match: safeMatch });
  } catch (err) {
    console.error('[UNDO ERROR]', err.message);
    return NextResponse.json({ error: err.message || 'Undo action failed' }, { status: 400 });
  }
}
