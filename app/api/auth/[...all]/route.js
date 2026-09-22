import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSessionTokenFromRequest, invalidateSession, buildClearSessionCookie } from '@/lib/auth';

export async function GET(req, { params }) {
  const path = params.all?.join('/') || '';

  if (path === 'get-session' || path === 'session') {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json(null, { status: 401 });
    return NextResponse.json({ user, session: { userId: user.id } });
  }

  return NextResponse.json({ message: `Better Auth endpoint: ${path}` });
}

export async function POST(req, { params }) {
  const path = params.all?.join('/') || '';

  if (path === 'sign-out' || path === 'logout') {
    const token = getSessionTokenFromRequest(req);
    if (token) await invalidateSession(token);
    const res = NextResponse.json({ success: true });
    res.headers.append('Set-Cookie', buildClearSessionCookie());
    return res;
  }

  return NextResponse.json({ message: `Better Auth POST endpoint: ${path}` });
}
