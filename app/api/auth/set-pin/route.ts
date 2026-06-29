import { NextRequest, NextResponse } from 'next/server';
import { pbkdf2Sync } from 'crypto';
import { verifyOtpToken, signSessionToken } from '../../../../lib/otp';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

function hashPin(pin: string, phone: string): string {
  return pbkdf2Sync(pin, phone, 10000, 32, 'sha256').toString('hex');
}

// POST /api/auth/set-pin  { phone, pin, otpToken }
// Called after first OTP verify to set the user's 4-digit PIN.
export async function POST(req: NextRequest) {
  try {
    const { phone, pin, otpToken } = await req.json();
    if (!phone || !pin || String(pin).length !== 4 || !otpToken) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return NextResponse.json({ error: 'PIN باید ۴ رقم عددی باشد' }, { status: 400 });
    }

    // Re-verify the OTP token to confirm identity
    const claims = verifyOtpToken(String(otpToken));
    if (!claims || claims.phone !== String(phone)) {
      return NextResponse.json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
    }

    const hashed = hashPin(String(pin), String(phone));
    await db.update(users).set({ pin: hashed }).where(eq(users.phoneNumber, String(phone)));

    const matched = await db.select().from(users).where(eq(users.phoneNumber, String(phone)));
    if (!matched.length) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

    const { pin: _omit, ...safeUser } = matched[0] as any;
    return NextResponse.json({ user: { ...safeUser, isInsider: true }, sessionToken: signSessionToken(String(phone)) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
