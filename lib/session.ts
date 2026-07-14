// Server-side request authentication for manager-only / insider-only API routes.
// Reads the signed session token from an Authorization: Bearer header (preferred)
// or a ?token= query param (fallback), verifies it, and loads isManager from DB.
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './otp';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthedUser {
  phone: string;
  userId: number | null;
  isManager: boolean;
}

export async function getAuthedUser(req: NextRequest): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.nextUrl.searchParams.get('token');
  if (!token) return null;

  const claims = verifySessionToken(token);
  if (!claims) return null;

  const rows = await db.select().from(users).where(eq(users.phoneNumber, claims.phone));
  if (rows.length === 0) {
    // Valid signed session but the phone isn't a registered advisor/manager —
    // still a legitimately logged-in app user (e.g. a public visitor who
    // verified OTP), just with no manager privileges.
    return { phone: claims.phone, userId: null, isManager: false };
  }
  return { phone: claims.phone, userId: rows[0].id, isManager: !!rows[0].isManager };
}

/* Throws-free guard: returns true only for a verified, currently-manager user. */
export async function requireManager(req: NextRequest): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req);
  return user?.isManager ? user : null;
}
