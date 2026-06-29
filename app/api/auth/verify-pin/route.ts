import { NextRequest, NextResponse } from 'next/server';
import { pbkdf2Sync } from 'crypto';
import { signSessionToken } from '../../../../lib/otp';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

function hashPin(pin: string, phone: string): string {
  return pbkdf2Sync(pin, phone, 10000, 32, 'sha256').toString('hex');
}

// POST /api/auth/verify-pin  { phone, pin }
export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();
    if (!phone || !pin || String(pin).length !== 4) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const matched = await db.select().from(users).where(eq(users.phoneNumber, String(phone)));
    if (!matched.length || !matched[0].pin) {
      return NextResponse.json({ error: 'کاربر یافت نشد یا PIN تنظیم نشده' }, { status: 400 });
    }

    const expected = hashPin(String(pin), String(phone));
    if (matched[0].pin !== expected) {
      return NextResponse.json({ error: 'PIN وارد شده صحیح نیست' }, { status: 401 });
    }

    const { pin: _omit, ...safeUser } = matched[0] as any;
    return NextResponse.json({ user: { ...safeUser, isInsider: true }, sessionToken: signSessionToken(String(phone)) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
