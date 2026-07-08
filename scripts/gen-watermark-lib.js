// One-off generator: extracts LOGO_B64 from the image route and writes lib/watermark.ts
const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '..', 'app', 'api', 'listing-image', '[id]', 'route.ts');
const src = fs.readFileSync(routePath, 'utf8');
const m = src.match(/const LOGO_B64 = '([A-Za-z0-9+/=]+)';/);
if (!m) { console.error('LOGO_B64 not found'); process.exit(1); }
const b64 = m[1];

const lib = `// Shared Mahoor-logo watermark helper (sharp).
// Used by the /api/listing-image proxy (web/site images) and lib/publish.ts
// (photos sent to Telegram/Bale channels). Originals in the DB are never modified.
import sharp from 'sharp';

// icon-192x192.png embedded as base64 — always bundled, no fs dependency at runtime.
const LOGO_B64 = '${b64}';
const LOGO_BUF = Buffer.from(LOGO_B64, 'base64');

const WM_FRACTION = 0.18; // watermark = 18% of image width
const WM_OPACITY  = 0.65; // 65% opacity
const WM_MARGIN   = 14;   // px from bottom-right edge

// Per-process cache keyed by image-width bucket (multiple of 50px)
const wmCache = new Map<number, Buffer>();

async function buildWatermark(imgWidth: number): Promise<Buffer> {
  const bucket = Math.round(imgWidth / 50) * 50;
  if (wmCache.has(bucket)) return wmCache.get(bucket)!;

  const wmWidth = Math.max(48, Math.round(bucket * WM_FRACTION));

  // Resize logo, ensure RGBA, then scale alpha channel to WM_OPACITY
  const { data, info } = await sharp(LOGO_BUF)
    .resize(wmWidth, null, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  for (let i = 3; i < buf.length; i += 4) {
    buf[i] = Math.round(buf[i] * WM_OPACITY);
  }

  const wm = await sharp(buf, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();

  wmCache.set(bucket, wm);
  return wm;
}

/* Composite the Mahoor logo bottom-right onto a raw image buffer → JPEG buffer. */
export async function watermarkImageBuffer(imgBuf: Buffer): Promise<Buffer> {
  const { width: imgW = 800, height: imgH = 600 } = await sharp(imgBuf).metadata();
  const wm = await buildWatermark(imgW);
  const { width: wmW = 0, height: wmH = 0 } = await sharp(wm).metadata();

  const left = Math.max(0, imgW - wmW - WM_MARGIN);
  const top  = Math.max(0, imgH - wmH - WM_MARGIN);

  return sharp(imgBuf)
    .composite([{ input: wm, left, top }])
    .jpeg({ quality: 82 })
    .toBuffer();
}

/* Watermark a base64 data URL → new JPEG data URL. Returns the original on failure. */
export async function watermarkDataUrl(dataUrl: string): Promise<string> {
  try {
    if (!dataUrl.startsWith('data:image/')) return dataUrl;
    const imgBuf = Buffer.from(dataUrl.replace(/^data:image\\/\\w+;base64,/, ''), 'base64');
    const out = await watermarkImageBuffer(imgBuf);
    return 'data:image/jpeg;base64,' + out.toString('base64');
  } catch {
    return dataUrl; // never block channel publishing because of a watermark error
  }
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'watermark.ts'), lib);
console.log('lib/watermark.ts written,', lib.length, 'chars');
