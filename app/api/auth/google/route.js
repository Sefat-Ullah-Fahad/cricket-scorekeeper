import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/oauth';

export async function GET(req) {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('[OAUTH ERROR] Failed to generate Google auth URL:', err);
    return NextResponse.redirect(
      new URL('/login?error=google_oauth_not_configured', req.url)
    );
  }
}
