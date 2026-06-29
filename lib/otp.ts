// Stateless HMAC-signed OTP tokens — no database or external storage needed.
// Token format: base64url(JSON payload) . HMAC-SHA256 hex signature
// Payload:      { phone, code, exp }   (exp = Unix ms timestamp)

import crypto from 'crypto';

const TTL_MS = 2 * 60 * 1000; // 2 minutes — matches the client countdown timer

function secret(): string {
  const s = process.env.OTP_SECRET;
  if (!s) {
    // Dev-only fallback — logs a warning so it's never silently insecure in production
    console.warn('[OTP] OTP_SECRET env var not set; using dev fallback. Set it in Vercel env for production.');
    return 'mahoor-otp-dev-fallback-set-OTP_SECRET-in-vercel';
  }
  return s;
}

export function signOtpToken(phone: string, code: string): string {
  const payload = JSON.stringify({ phone, code, exp: Date.now() + TTL_MS });
  const b64     = Buffer.from(payload).toString('base64url');
  const sig     = crypto.createHmac('sha256', secret()).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signSessionToken(phone: string): string {
  const payload = JSON.stringify({ phone, exp: Date.now() + SESSION_TTL });
  const b64     = Buffer.from(payload).toString('base64url');
  const sig     = crypto.createHmac('sha256', secret()).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string): { phone: string } | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const b64 = token.slice(0, dot);
    const sig  = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', secret()).update(b64).digest('hex');
    const sigBuf = Buffer.from(sig,      'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const payload: { phone: string; exp: number } = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (Date.now() > payload.exp) return null;
    return { phone: payload.phone };
  } catch { return null; }
}

export function verifyOtpToken(token: string): { phone: string; code: string } | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const b64 = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    // Constant-time comparison to prevent timing attacks
    const expected = crypto.createHmac('sha256', secret()).update(b64).digest('hex');
    const sigBuf  = Buffer.from(sig,      'hex');
    const expBuf  = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const payload: { phone: string; code: string; exp: number } =
      JSON.parse(Buffer.from(b64, 'base64url').toString());

    if (Date.now() > payload.exp) return null; // expired

    return { phone: payload.phone, code: payload.code };
  } catch {
    return null;
  }
}
