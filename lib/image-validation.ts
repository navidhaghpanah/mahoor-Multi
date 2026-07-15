// Server-side guard for any base64 image data accepted from a client
// (POST /api/listings images[], PATCH appendImage). The web form compresses
// to ~150-300KB via canvas before sending, but the Telegram/Bale bot flow
// stores Telegram's raw "largest" photo variant uncompressed — so the cap
// here is generous (8MB decoded) rather than matching the web client's
// output size. This exists to reject non-image junk and absurdly oversized
// payloads sent directly to the API (bypassing the browser's compression),
// not to enforce a tight size budget.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB decoded
const MIN_IMAGE_BYTES = 100; // rejects empty/near-empty junk
const DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;

export function isValidImageDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!DATA_URL_RE.test(value)) return false;

  const commaIdx = value.indexOf(',');
  const b64 = value.slice(commaIdx + 1);
  if (!b64) return false;

  // Reject anything that isn't plausible base64 (defends against someone
  // stuffing arbitrary text after the data: prefix)
  if (!/^[A-Za-z0-9+/]+=*$/.test(b64)) return false;

  const approxBytes = (b64.length * 3) / 4;
  return approxBytes >= MIN_IMAGE_BYTES && approxBytes <= MAX_IMAGE_BYTES;
}

/* Filters an array down to only valid image data URLs (invalid entries are dropped, not errored). */
export function filterValidImages(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(isValidImageDataUrl);
}
