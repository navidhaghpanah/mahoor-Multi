import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function sanitizePhone(phone: string): string {
  const persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  let s = String(phone).trim();
  persian.forEach((c, i) => { s = s.replaceAll(c, String(i)); });
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code, token } = await req.json();

    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedCode  = String(code).trim();

    // Decode token
    let decoded: string;
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'توکن نامعتبر است.' }, { status: 400 });
    }

    const parts = decoded.split(':');
    if (parts.length < 3) {
      return NextResponse.json({ error: 'توکن نامعتبر است.' }, { status: 400 });
    }
    const [tokenPhone, timestampStr, tokenHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    if (tokenPhone !== sanitizedPhone) {
      return NextResponse.json({ error: 'توکن با شماره موبایل مطابقت ندارد.' }, { status: 400 });
    }

    if (Date.now() - timestamp > OTP_EXPIRY_MS) {
      return NextResponse.json({ error: 'کد تأیید منقضی شده است. لطفاً دوباره درخواست کنید.' }, { status: 400 });
    }

    const secret       = process.env.OTP_SECRET ?? 'mahoor-otp-fallback-secret';
    const expectedHmac = createHmac('sha256', secret)
      .update(`${sanitizedPhone}:${sanitizedCode}:${timestamp}`)
      .digest('hex');

    if (expectedHmac !== tokenHmac) {
      return NextResponse.json({ error: 'کد وارد شده اشتباه است.' }, { status: 400 });
    }

    const found = await db.select().from(users).where(eq(users.phoneNumber, sanitizedPhone));
    if (found.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    return NextResponse.json({ user: found[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
