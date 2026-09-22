import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyPassword, createSession, buildSessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.collection('users').findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account was created with Google Sign-In. Please use Continue with Google.' },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const userId = user._id ? user._id.toString() : user.id;
    const { token, expiresAt } = await createSession(userId);

    const safeUser = {
      id: userId,
      name: user.name,
      email: user.email,
      image: user.image || null,
      teamName: user.teamName || '',
      theme: user.theme || 'dark',
      language: user.language || 'en',
    };

    const res = NextResponse.json({ success: true, user: safeUser });
    res.headers.append('Set-Cookie', buildSessionCookie(token, expiresAt));
    return res;
  } catch (err) {
    console.error('[AUTH ERROR] Login failed:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
