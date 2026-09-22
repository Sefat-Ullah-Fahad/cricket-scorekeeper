import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';
import { broadcastMatchUpdate } from '@/lib/realtime';

export async function POST(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { shareEnabled } = body;

    const { db } = await connectToDatabase();
    const query = { _id: id.length === 24 ? new ObjectId(id) : id };
    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isEnabled = Boolean(shareEnabled);
    await db.collection('matches').updateOne(query, {
      $set: {
        shareEnabled: isEnabled,
        updatedAt: new Date(),
      }
    });

    const safeMatch = {
      ...match,
      shareEnabled: isEnabled,
      id: match._id ? match._id.toString() : match.id,
      _id: undefined,
    };

    broadcastMatchUpdate(match.shareToken, safeMatch);

    return NextResponse.json({
      success: true,
      shareEnabled: isEnabled,
      shareToken: match.shareToken,
    });
  } catch (err) {
    console.error('[SHARE ERROR]', err.message);
    return NextResponse.json({ error: 'Failed to update share settings' }, { status: 500 });
  }
}
