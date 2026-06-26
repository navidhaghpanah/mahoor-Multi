import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomInt } from 'crypto';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

function sanitizePhone(phone: string): string {
  const persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  let s = String(phone).trim();
  persian.forEach((c, i) => { s = s.replaceAll(c, String(i)); });
  return s;
}

async function sendSmartSMS(to: string, code: string): Promise<void> {
  const body = {
    username: process.env.SMARTSMS_USERNAME,
    password: process.env.SMARTSMS_PASSWORD,
    from:     process.env.SMARTSMS_FROM,
    to,
    text: `کد تأیید ورود به پنل ماهور:\n${code}\nلغو۱۱`,
  };
  const res = await fetch('https://rest.payamak-panel.com/api/SmartSMS/Send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('خطا در اتصال به سرویس پیامک');
  const data = await res.json();
  if (String(data.RetStatus) !== '1') {
    throw new Error(`خطای پیامک (${data.ReqStatus ?? data.RetStatus}): ${data.Message ?? ''}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const sanitized = sanitizePhone(phone);

    // Check registration first — saves SMS credit
    const found = await db.select({ fullName: users.fullName })
      .from(users).where(eq(users.phoneNumber, sanitized));
    if (found.length === 0) {
      return NextResponse.json({ error: 'کاربری با این شماره در سیستم یافت نشد.' }, { status: 404 });
    }

    const code      = String(randomInt(100000, 999999));
    const timestamp = Date.now();
    const secret    = process.env.OTP_SECRET ?? 'mahoor-otp-fallback-secret';
    const hmac      = createHmac('sha256', secret)
      .update(`${sanitized}:${code}:${timestamp}`)
      .digest('hex');
    const token = Buffer.from(`${sanitized}:${timestamp}:${hmac}`).toString('base64url');

    await sendSmartSMS(sanitized, code);

    return NextResponse.json({ token, name: found[0].fullName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
