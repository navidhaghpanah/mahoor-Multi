// Server-side only. Sends OTP via HostIran / Melipayamak REST API.
// Reads SMS_USERNAME, SMS_PASSWORD, SMS_SENDER from env.
// No-ops gracefully (with a console warning) if credentials are unset —
// the login flow continues and the caller receives a warning but no crash.

const ENDPOINT = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
const DEFAULT_SENDER = '3000493453333';

export async function sendOtp(phone: string, code: string): Promise<void> {
  const username = process.env.SMS_USERNAME;
  const password = process.env.SMS_PASSWORD;
  const from     = process.env.SMS_SENDER ?? DEFAULT_SENDER;

  if (!username || !password) {
    console.warn('[SMS] SMS_USERNAME / SMS_PASSWORD not set — skipping real SMS send. Code:', code);
    return;
  }

  const text = `کد ورود شما به املاک ماهور: ${code}`;

  try {
    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password, to: phone, from, text, isFlash: false }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.RetStatus !== 1) {
      console.error('[SMS] send failed:', data?.StrRetStatus ?? `HTTP ${res.status}`, '| RetStatus:', data?.RetStatus);
    } else {
      console.log('[SMS] sent to', phone, '| Value:', data.Value);
    }
  } catch (e: any) {
    console.error('[SMS] network error:', e?.message ?? e);
    // swallowed — never crash the OTP route
  }
}
