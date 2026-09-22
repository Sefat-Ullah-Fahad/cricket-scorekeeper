import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashPassword, createSession, buildSessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const userDoc = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      image: null,
      teamName: '',
      theme: 'dark',
      language: 'en',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('users').insertOne(userDoc);
    const userId = result.insertedId.toString();

    const { token, expiresAt } = await createSession(userId);

    const safeUser = {
      id: userId,
      name: userDoc.name,
      email: userDoc.email,
      image: userDoc.image,
      teamName: userDoc.teamName,
      theme: userDoc.theme,
      language: userDoc.language,
    };

    const res = NextResponse.json({ success: true, user: safeUser }, { status: 201 });
    res.headers.append('Set-Cookie', buildSessionCookie(token, expiresAt));
    return res;
  } catch (err) {
    console.error('[AUTH ERROR] Register failed:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
