import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../lib/otp';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/auth/me?token=<sessionToken>
// Verifies a 30-day session token and returns fresh user data from the DB.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'no token' }, { status: 400 });

    const claims = verifySessionToken(token);
    if (!claims) return NextResponse.json({ error: 'invalid or expired session' }, { status: 401 });

    const matched = await db.select().from(users).where(eq(users.phoneNumber, claims.phone));

    if (matched.length > 0) {
      const { pin: _omit, ...safeUser } = matched[0] as any;
      return NextResponse.json({ user: { ...safeUser, isInsider: true } });
    }

    // Phone not in DB = public visitor
    return NextResponse.json({
      user: {
        id: null, uid: null,
        fullName: 'بازدیدکننده',
        phoneNumber: claims.phone,
        agencyName: '', licenseNumber: '', email: '', agencyAddress: '',
        currentPlan: 'عمومی', planExpiryDate: '',
        adsLimitRemaining: 3, totalAdsAllowed: 3,
        directSyncLimitRemaining: 0, totalDirectSyncLimit: 0,
        isManager: false, title: null,
        isInsider: false,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
