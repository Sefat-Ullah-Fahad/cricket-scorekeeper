import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/oauth';
import { connectToDatabase } from '@/lib/mongodb';
import { createSession, buildSessionCookie } from '@/lib/auth';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

  if (error || !code) {
    console.error('[OAUTH ERROR] Google callback error:', error || 'No code provided');
    return NextResponse.redirect(new URL('/login?error=oauth_cancelled', appUrl));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser || !googleUser.email) {
      throw new Error('Failed to retrieve user email from Google');
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    let user = await db.collection('users').findOne({ email: normalizedEmail });

    const now = new Date();
    if (!user) {
      const newUserDoc = {
        name: googleUser.name || 'Cricket Player',
        email: normalizedEmail,
        googleId: googleUser.id,
        image: googleUser.picture || null,
        passwordHash: null,
        teamName: '',
        theme: 'dark',
        language: 'en',
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection('users').insertOne(newUserDoc);
      user = { ...newUserDoc, _id: result.insertedId };
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: googleUser.id,
            image: googleUser.picture || user.image,
            updatedAt: now,
          }
        }
      );
    }

    const userId = user._id ? user._id.toString() : user.id;
    const { token, expiresAt } = await createSession(userId);

    const redirectResponse = NextResponse.redirect(new URL('/dashboard', appUrl));
    redirectResponse.headers.append('Set-Cookie', buildSessionCookie(token, expiresAt));
    return redirectResponse;
  } catch (err) {
    console.error('[OAUTH ERROR] Failed handling Google OAuth callback:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl));
  }
}
