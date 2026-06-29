import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpToken } from '../../../../lib/otp';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/auth/verify-otp  { token, code }
// → verifies HMAC token + matching code → looks up phone in DB → returns user session.
export async function POST(req: NextRequest) {
  try {
    const { token, code } = await req.json();

    if (!token || !code) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    // Verify signature + expiry
    const claims = verifyOtpToken(String(token));
    if (!claims) {
      return NextResponse.json({ error: 'کد منقضی شده یا نامعتبر است. دوباره درخواست کد کنید.' }, { status: 400 });
    }

    // Verify code matches (timing-safe string compare is overkill for 4 digits, but simple equality is fine here)
    if (String(code).trim() !== claims.code) {
      return NextResponse.json({ error: 'کد وارد شده صحیح نیست' }, { status: 400 });
    }

    const phone = claims.phone;

    // DB lookup — insider (advisor/manager) or public visitor
    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phone));

    if (matchedUsers.length > 0) {
      const u = matchedUsers[0];
      // If insider has no PIN yet, tell the client to set one now
      const needsPinSetup = !u.pin;
      const { pin: _omit, ...safeUser } = u as any;
      return NextResponse.json({ user: { ...safeUser, isInsider: true }, needsPinSetup });
    }

    // Public visitor — same shape as login route
    return NextResponse.json({
      user: {
        id: null, uid: null,
        fullName: 'بازدیدکننده',
        phoneNumber: phone,
        agencyName: '', licenseNumber: '', email: '', agencyAddress: '',
        currentPlan: 'عمومی', planExpiryDate: '',
        adsLimitRemaining: 3,  totalAdsAllowed: 3,
        directSyncLimitRemaining: 0, totalDirectSyncLimit: 0,
        isManager: false, title: null,
        isInsider: false,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
