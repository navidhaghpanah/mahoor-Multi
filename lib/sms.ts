// Server-side only. Sends OTP via sms.ir's Verify API.
// Reads SMS_IR_API_KEY, SMS_IR_TEMPLATE_ID from env — never hardcode these.
// No-ops gracefully (with a console warning) if credentials are unset —
// the login flow continues and the caller receives a warning but no crash.

const ENDPOINT = 'https://api.sms.ir/v1/send/verify';

// Returns true only when the gateway confirms the message was actually sent.
// Callers must treat false as "the code was not delivered" — never fall back to
// exposing the code some other way (e.g. in an API response) once credentials
// are configured, since that would let anyone log in as any phone number.
export async function sendOtp(phone: string, code: string): Promise<boolean> {
  const apiKey     = process.env.SMS_IR_API_KEY;
  const templateId = process.env.SMS_IR_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    console.warn('[SMS] SMS_IR_API_KEY / SMS_IR_TEMPLATE_ID not set — skipping real SMS send. Code:', code);
    return false;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'text/plain',
        'x-api-key':    apiKey,
      },
      body: JSON.stringify({
        mobile:     phone,
        templateId: Number(templateId),
        parameters: [{ name: 'Code', value: code }],
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.status !== 1) {
      console.error('[SMS] send failed:', data?.message ?? `HTTP ${res.status}`, '| status:', data?.status);
      return false;
    }
    console.log('[SMS] sent to', phone, '| messageId:', data.data?.messageId);
    return true;
  } catch (e: any) {
    console.error('[SMS] network error:', e?.message ?? e);
    return false;
  }
}
