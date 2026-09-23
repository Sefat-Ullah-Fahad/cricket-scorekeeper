import { NextResponse } from 'next/server';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();
    const query = { _id: id.length === 24 ? new ObjectId(id) : id };
    const match = await db.collection('matches').findOne(query);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const safeMatch = { ...match, id: match._id ? match._id.toString() : match.id, _id: undefined };
    return NextResponse.json({ match: safeMatch });
  } catch (err) {
    console.error('[ALL-MATCH API ERROR]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}