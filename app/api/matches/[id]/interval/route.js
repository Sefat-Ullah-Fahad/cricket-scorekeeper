import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { setMatchInterval, resumeMatch, concludeMatch } from '@/lib/cricket-engine';
import { broadcastMatchUpdate } from '@/lib/realtime';

export async function POST(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, intervalType = 'CUSTOM', note, result: customResult } = body;

    const { db } = await connectToDatabase();
    const query = { _id: id.length === 24 ? new ObjectId(id) : id };
    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let updatedMatch;
    if (action === 'PAUSE' || action === 'INTERVAL') {
      updatedMatch = setMatchInterval(match, intervalType, note);
    } else if (action === 'RESUME') {
      updatedMatch = resumeMatch(match);
    } else if (action === 'CONCLUDE') {
      updatedMatch = concludeMatch(match, customResult);
    } else {
      return NextResponse.json({ error: 'Invalid interval action' }, { status: 400 });
    }

    updatedMatch.updatedAt = new Date();

    await db.collection('matches').updateOne(query, {
      $set: {
        status: updatedMatch.status,
        result: updatedMatch.result,
        intervals: updatedMatch.intervals || [],
        currentInterval: updatedMatch.currentInterval || null,
        updatedAt: updatedMatch.updatedAt,
      },
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
    console.error('[INTERVAL ERROR]', err.message);
    return NextResponse.json({ error: err.message || 'Interval update failed' }, { status: 400 });
  }
}
