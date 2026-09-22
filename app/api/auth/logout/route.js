import { NextResponse } from 'next/server';
import { getSessionTokenFromRequest, invalidateSession, buildClearSessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const token = getSessionTokenFromRequest(req);
    if (token) {
      await invalidateSession(token);
    }

    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    res.headers.append('Set-Cookie', buildClearSessionCookie());
    return res;
  } catch (err) {
    console.error('[AUTH ERROR] Logout failed:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
