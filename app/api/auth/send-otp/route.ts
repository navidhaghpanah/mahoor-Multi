import { NextRequest, NextResponse } from 'next/server';
import { signOtpToken } from '../../../../lib/otp';
import { sendOtp } from '../../../../lib/sms';

// POST /api/auth/send-otp  { phone }
// → generates a 4-digit code, signs a short-lived HMAC token, fires the SMS,
//   returns { token } for the client to store temporarily in React state.
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).length < 10) {
      return NextResponse.json({ error: 'شماره موبایل معتبر نیست' }, { status: 400 });
    }

    // Normalise Persian/Arabic-Indic digits to ASCII (matches login route convention)
    const persianNums = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    const arabicNums  = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    let normalised = String(phone);
    for (let i = 0; i < 10; i++) {
      normalised = normalised.replaceAll(persianNums[i], i.toString())
                             .replaceAll(arabicNums[i],  i.toString());
    }

    const code  = String(Math.floor(1000 + Math.random() * 9000));
    const token = signOtpToken(normalised, code);

    // Fire-and-forget (sendOtp never throws — errors are logged internally)
    void sendOtp(normalised, code);

    return NextResponse.json({ token, code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
