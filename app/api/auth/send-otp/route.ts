import { NextRequest, NextResponse } from 'next/server';
import { signOtpToken } from '../../../../lib/otp';
import { sendOtp } from '../../../../lib/sms';
import { db } from '../../../../src/db/index';
import { users } from '../../../../src/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/auth/send-otp  { phone }
// If the user already has a PIN: returns { hasPIN: true } — no OTP sent.
// Otherwise: generates a 4-digit OTP, sends SMS, returns { token } (no code in body).
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).length < 10) {
      return NextResponse.json({ error: 'شماره موبایل معتبر نیست' }, { status: 400 });
    }

    const persianNums = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    const arabicNums  = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    let normalised = String(phone);
    for (let i = 0; i < 10; i++) {
      normalised = normalised.replaceAll(persianNums[i], i.toString())
                             .replaceAll(arabicNums[i],  i.toString());
    }

    // If user already has a PIN set, skip OTP entirely — client will show PIN prompt
    const matched = await db.select({ pin: users.pin })
      .from(users).where(eq(users.phoneNumber, normalised));
    if (matched.length > 0 && matched[0].pin) {
      return NextResponse.json({ hasPIN: true });
    }

    const code  = String(Math.floor(1000 + Math.random() * 9000));
    const token = signOtpToken(normalised, code);
    void sendOtp(normalised, code);

    // Never return the code in the response body — delivery is via SMS only
    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
