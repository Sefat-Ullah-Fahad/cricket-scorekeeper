import { connectToDatabase, ObjectId } from './mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'cricket_session';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days persistent

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Creates a persistent database session for the user
 */
export async function createSession(userId, userAgent = '') {
  const { db } = await connectToDatabase();
  const token = generateRandomToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const sessionDoc = {
    userId: userId.toString(),
    token,
    userAgent,
    createdAt: now,
    expiresAt,
  };

  await db.collection('sessions').insertOne(sessionDoc);
  return { token, expiresAt };
}

/**
 * Validates a session token and retrieves the authenticated user
 */
export async function getSession(token) {
  if (!token) return null;
  const { db } = await connectToDatabase();
  const session = await db.collection('sessions').findOne({ token });

  if (!session) return null;

  if (new Date() > new Date(session.expiresAt)) {
    // Session expired, remove it
    await db.collection('sessions').deleteOne({ token });
    return null;
  }

  // Fetch the user
  const user = await db.collection('users').findOne({
    _id: session.userId.length === 24 ? new ObjectId(session.userId) : session.userId
  });

  if (!user) return null;

  return {
    user: sanitizeUser(user),
    session: {
      id: session._id ? session._id.toString() : session.token,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt
    }
  };
}

/**
 * Invalidates and deletes a session token
 */
export async function invalidateSession(token) {
  if (!token) return;
  const { db } = await connectToDatabase();
  await db.collection('sessions').deleteOne({ token });
}

/**
 * Strips password hash and private tokens before sending user object to client
 */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name || 'User',
    email: user.email,
    image: user.image || null,
    teamName: user.teamName || '',
    theme: user.theme || 'dark',
    language: user.language || 'en',
    createdAt: user.createdAt,
  };
}

/**
 * Reads session cookie from Request (NextRequest or standard Request)
 */
export function getSessionTokenFromRequest(req) {
  try {
    if (req.cookies && typeof req.cookies.get === 'function') {
      const cookie = req.cookies.get(SESSION_COOKIE_NAME);
      return cookie ? (cookie.value || cookie) : null;
    }
    const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    return cookies[SESSION_COOKIE_NAME] || null;
  } catch (err) {
    console.error('[AUTH ERROR] Reading cookie token:', err.message);
    return null;
  }
}

/**
 * Server-side helper to verify user authentication in any route
 */
export async function getAuthenticatedUser(req) {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  const result = await getSession(token);
  return result ? result.user : null;
}

export function buildSessionCookie(token, expiresAt) {
  const isProduction = process.env.NODE_ENV === 'production';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${isProduction ? '; Secure' : ''}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
