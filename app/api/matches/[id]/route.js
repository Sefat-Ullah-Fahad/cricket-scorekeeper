import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';

export async function GET(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { db } = await connectToDatabase();

    const query = {
      _id: id.length === 24 ? new ObjectId(id) : id,
    };

    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // STRICT OWNERSHIP CHECK: User A cannot see User B's match
    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const safeMatch = {
      ...match,
      id: match._id ? match._id.toString() : match.id,
      _id: undefined,
    };

    return NextResponse.json({ match: safeMatch });
  } catch (err) {
    console.error('[MATCH ERROR] Get match failed:', err);
    return NextResponse.json({ error: 'Failed to retrieve match' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { db } = await connectToDatabase();

    const query = {
      _id: id.length === 24 ? new ObjectId(id) : id,
    };

    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Ownership check
    if (match.ownerId !== user.id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.collection('matches').deleteOne(query);

    return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch (err) {
    console.error('[MATCH ERROR] Delete match failed:', err);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}
