import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, ObjectId } from '@/lib/mongodb';

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[PROFILE ERROR] Get profile failed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, teamName, theme, language } = body;

    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof teamName === 'string') updates.teamName = teamName.trim();
    if (['dark', 'light'].includes(theme)) updates.theme = theme;
    if (['en', 'bn'].includes(language)) updates.language = language;
    updates.updatedAt = new Date();

    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: user.id.length === 24 ? new ObjectId(user.id) : user.id },
      { $set: updates }
    );

    const updatedUser = {
      ...user,
      ...updates
    };

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[PROFILE ERROR] Update profile failed:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
